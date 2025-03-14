import {
  Deployment,
  DaemonSet,
  StatefulSet,
  ReplicaSet,
  ReplicaSetList,
  ControllerRevisionList,
  ControllerRevision,
} from 'kubernetes-types/apps/v1';
import { Pod } from 'kubernetes-types/core/v1';
import filesizeParser from 'filesize-parser';

import { Application, ApplicationPatch, Revision } from './types';
import {
  appOwnerLabel,
  defaultDeploymentUniqueLabel,
  unchangedAnnotationKeysForRollbackPatch,
  appRevisionAnnotation,
} from './constants';

// type guard to check if an application is a deployment, daemonset, statefulset or pod
export function applicationIsKind<T extends Application>(
  appKind: 'Deployment' | 'DaemonSet' | 'StatefulSet' | 'Pod',
  application?: Application
): application is T {
  return application?.kind === appKind;
}

// the application is external if it has no owner label
export function isExternalApplication(application: Application) {
  return !application.metadata?.labels?.[appOwnerLabel];
}

function getDeploymentRunningPods(deployment: Deployment): number {
  const availableReplicas = deployment.status?.availableReplicas ?? 0;
  const totalReplicas = deployment.spec?.replicas ?? 0;
  const unavailableReplicas = deployment.status?.unavailableReplicas ?? 0;
  return availableReplicas || totalReplicas - unavailableReplicas;
}

function getDaemonSetRunningPods(daemonSet: DaemonSet): number {
  const numberAvailable = daemonSet.status?.numberAvailable ?? 0;
  const desiredNumberScheduled = daemonSet.status?.desiredNumberScheduled ?? 0;
  const numberUnavailable = daemonSet.status?.numberUnavailable ?? 0;
  return numberAvailable || desiredNumberScheduled - numberUnavailable;
}

function getStatefulSetRunningPods(statefulSet: StatefulSet): number {
  return statefulSet.status?.readyReplicas ?? 0;
}

export function getRunningPods(
  application: Deployment | DaemonSet | StatefulSet
): number {
  switch (application.kind) {
    case 'Deployment':
      return getDeploymentRunningPods(application);
    case 'DaemonSet':
      return getDaemonSetRunningPods(application);
    case 'StatefulSet':
      return getStatefulSetRunningPods(application);
    default:
      throw new Error('Unknown application type');
  }
}

export function getTotalPods(
  application: Deployment | DaemonSet | StatefulSet
): number {
  switch (application.kind) {
    case 'Deployment':
    case 'StatefulSet':
      return application.spec?.replicas ?? 0;
    case 'DaemonSet':
      return application.status?.desiredNumberScheduled ?? 0;
    default:
      throw new Error('Unknown application type');
  }
}

function parseCpu(cpu: string) {
  let res = parseInt(cpu, 10);
  if (cpu.endsWith('m')) {
    res /= 1000;
  } else if (cpu.endsWith('n')) {
    res /= 1000000000;
  }
  return res;
}

// bytesToReadableFormat converts bytes to a human readable string (e.g. '1.5 GB'), assuming base 10
// there's some discussion about whether base 2 or base 10 should be used for memory units
// https://www.quora.com/Is-1-GB-equal-to-1024-MB-or-1000-MB
export function bytesToReadableFormat(memoryBytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let memoryValue = memoryBytes;
  while (memoryValue > 1000 && unitIndex < units.length) {
    memoryValue /= 1000;
    unitIndex++;
  }
  return `${memoryValue.toFixed(1)} ${units[unitIndex]}`;
}

// getResourceRequests returns the total cpu and memory requests for all containers in an application
export function getResourceRequests(application: Application) {
  const appContainers = applicationIsKind<Pod>('Pod', application)
    ? application.spec?.containers
    : application.spec?.template.spec?.containers;

  if (!appContainers) return null;

  const requests = appContainers.reduce(
    (acc, container) => {
      const cpu = container.resources?.requests?.cpu;
      const memory = container.resources?.requests?.memory;
      if (cpu) acc.cpu += parseCpu(cpu);
      if (memory) acc.memoryBytes += filesizeParser(memory, { base: 10 });
      return acc;
    },
    { cpu: 0, memoryBytes: 0 }
  );

  return requests;
}

// getResourceLimits returns the total cpu and memory limits for all containers in an application
export function getResourceLimits(application: Application) {
  const appContainers = applicationIsKind<Pod>('Pod', application)
    ? application.spec?.containers
    : application.spec?.template.spec?.containers;

  if (!appContainers) return null;

  const limits = appContainers.reduce(
    (acc, container) => {
      const cpu = container.resources?.limits?.cpu;
      const memory = container.resources?.limits?.memory;
      if (cpu) acc.cpu += parseCpu(cpu);
      if (memory) acc.memory += filesizeParser(memory, { base: 10 });
      return acc;
    },
    { cpu: 0, memory: 0 }
  );

  return limits;
}

// matchLabelsToLabelSelectorValue converts a map of labels to a label selector value that can be used in the
// labelSelector param for the kube api to filter kube resources by labels
export function matchLabelsToLabelSelectorValue(obj?: Record<string, string>) {
  if (!obj) return '';
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

// filterRevisionsByOwnerUid filters a list of revisions to only include revisions that have the given uid in their
// ownerReferences
export function filterRevisionsByOwnerUid<T extends Revision>(
  revisions: T[],
  uid: string
) {
  return revisions.filter((revision) => {
    const ownerReferencesUids =
      revision.metadata?.ownerReferences?.map((or) => or.uid) || [];
    return ownerReferencesUids.includes(uid);
  });
}

// getRollbackPatchPayload returns the patch payload to rollback a deployment to the previous revision
// the patch should be able to update the deployment's template to the previous revision's template
export function getRollbackPatchPayload(
  application: Deployment | StatefulSet | DaemonSet,
  revisionList: ReplicaSetList | ControllerRevisionList
): ApplicationPatch {
  switch (revisionList.kind) {
    case 'ControllerRevisionList': {
      const previousRevision = getPreviousControllerRevision(
        revisionList.items
      );
      if (!previousRevision.data) {
        throw new Error('No data found in the previous revision.');
      }
      // payload matches the strategic merge patch format for a StatefulSet and DaemonSet
      return previousRevision.data;
    }
    case 'ReplicaSetList': {
      const previousRevision = getPreviousReplicaSetRevision(
        revisionList.items
      );

      // remove hash label before patching back into the deployment
      const revisionTemplate = previousRevision.spec?.template;
      if (revisionTemplate?.metadata?.labels) {
        delete revisionTemplate.metadata.labels[defaultDeploymentUniqueLabel];
      }

      // build the patch payload for the deployment from the replica set
      // keep the annotations to skip from the deployment, in the patch
      const applicationAnnotations = application.metadata?.annotations || {};
      const applicationAnnotationsInPatch =
        unchangedAnnotationKeysForRollbackPatch.reduce(
          (acc, annotationKey) => {
            if (applicationAnnotations[annotationKey]) {
              acc[annotationKey] = applicationAnnotations[annotationKey];
            }
            return acc;
          },
          {} as Record<string, string>
        );

      // add any annotations from the target revision that shouldn't be skipped
      const revisionAnnotations = previousRevision.metadata?.annotations || {};
      const revisionAnnotationsInPatch = Object.entries(
        revisionAnnotations
      ).reduce(
        (acc, [annotationKey, annotationValue]) => {
          if (
            !unchangedAnnotationKeysForRollbackPatch.includes(annotationKey)
          ) {
            acc[annotationKey] = annotationValue;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const patchAnnotations = {
        ...applicationAnnotationsInPatch,
        ...revisionAnnotationsInPatch,
      };

      // Create a patch of the Deployment that replaces spec.template
      const deploymentRollbackPatch = [
        {
          op: 'replace',
          path: '/spec/template',
          value: revisionTemplate,
        },
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: patchAnnotations,
        },
      ].filter((p) => !!p.value); // remove any patch that has no value
      // payload matches the json patch format for a Deployment
      return deploymentRollbackPatch;
    }
    default:
      throw new Error(`Unknown revision list kind ${revisionList.kind}.`);
  }
}

function getPreviousReplicaSetRevision(replicaSets: ReplicaSet[]) {
  // sort replicaset(s) using the revision annotation number (old to new).
  // Kubectl uses the same revision annotation key to determine the previous version
  // (see the Revision function, and where it's used https://github.com/kubernetes/kubectl/blob/27ec3dafa658d8873b3d9287421d636048b51921/pkg/util/deployment/deployment.go#LL70C11-L70C11)
  const sortedReplicaSets = replicaSets.sort((a, b) => {
    const aRevision =
      Number(a.metadata?.annotations?.[appRevisionAnnotation]) || 0;
    const bRevision =
      Number(b.metadata?.annotations?.[appRevisionAnnotation]) || 0;
    return aRevision - bRevision;
  });

  // if there are less than 2 revisions, there is no previous revision to rollback to
  if (sortedReplicaSets.length < 2) {
    throw new Error(
      'There are no previous revisions to rollback to. Please check the application revisions.'
    );
  }

  // get the second to last revision
  const previousRevision = sortedReplicaSets[sortedReplicaSets.length - 2];
  return previousRevision;
}

function getPreviousControllerRevision(
  controllerRevisions: ControllerRevision[]
) {
  // sort the list of ControllerRevisions by revision, using the creationTimestamp as a tie breaker (old to new)
  const sortedControllerRevisions = controllerRevisions.sort((a, b) => {
    if (a.revision === b.revision) {
      return (
        new Date(a.metadata?.creationTimestamp || '').getTime() -
        new Date(b.metadata?.creationTimestamp || '').getTime()
      );
    }
    return a.revision - b.revision;
  });

  // if there are less than 2 revisions, there is no previous revision to rollback to
  if (sortedControllerRevisions.length < 2) {
    throw new Error(
      'There are no previous revisions to rollback to. Please check the application revisions.'
    );
  }

  // get the second to last revision
  const previousRevision =
    sortedControllerRevisions[sortedControllerRevisions.length - 2];
  return previousRevision;
}
