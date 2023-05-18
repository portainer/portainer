import { Deployment, DaemonSet, StatefulSet } from 'kubernetes-types/apps/v1';
import { Pod } from 'kubernetes-types/core/v1';
import filesizeParser from 'filesize-parser';

import { Application } from './types';
import { appOwnerLabel } from './constants';

export function getNakedPods(
  pods: Pod[],
  deployments: Deployment[],
  daemonSets: DaemonSet[],
  statefulSets: StatefulSet[]
) {
  // naked pods are pods which are not owned by a deployment, daemonset, statefulset or replicaset
  // https://kubernetes.io/docs/concepts/configuration/overview/#naked-pods-vs-replicasets-deployments-and-jobs
  const appLabels = [
    ...deployments.map((deployment) => deployment.spec?.selector.matchLabels),
    ...daemonSets.map((daemonSet) => daemonSet.spec?.selector.matchLabels),
    ...statefulSets.map(
      (statefulSet) => statefulSet.spec?.selector.matchLabels
    ),
  ];

  const nakedPods = pods.filter((pod) => {
    const podLabels = pod.metadata?.labels;
    // if the pod has no labels, it is naked
    if (!podLabels) return true;
    // if the pod has labels, but no app labels, it is naked
    return !appLabels.some((appLabel) => {
      if (!appLabel) return false;
      return Object.entries(appLabel).every(
        ([key, value]) => podLabels[key] === value
      );
    });
  });

  return nakedPods;
}

// type guard to check if an application is a deployment, daemonset statefulset or pod
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
  const totalReplicas = deployment.status?.replicas ?? 0;
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
      return application.status?.replicas ?? 0;
    case 'DaemonSet':
      return application.status?.desiredNumberScheduled ?? 0;
    case 'StatefulSet':
      return application.status?.replicas ?? 0;
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
