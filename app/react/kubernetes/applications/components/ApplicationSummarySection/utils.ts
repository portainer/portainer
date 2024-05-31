import { Ingress } from '@/react/kubernetes/ingresses/types';

import { ServiceFormValues } from '../../CreateView/application-services/types';
import { ApplicationFormValues } from '../../types';
import {
  generateNewIngressesFromFormPaths,
  getServicePatchPayload,
} from '../../CreateView/application-services/utils';

import {
  KubernetesResourceType,
  KubernetesResourceAction,
  Summary,
} from './types';

export function getArticle(
  resourceType: KubernetesResourceType,
  resourceAction: KubernetesResourceAction
) {
  if (resourceAction === 'Delete' || resourceAction === 'Update') {
    return 'the';
  }
  if (resourceAction === 'Create' && resourceType === 'Ingress') {
    return 'an';
  }
  return 'a';
}

/**
 * generateResourceSummaryList maps formValues to create and update summaries
 */
export function getAppResourceSummaries(
  newFormValues: ApplicationFormValues,
  oldFormValues?: ApplicationFormValues
): Array<Summary> {
  if (!oldFormValues?.Name) {
    return getCreatedApplicationResourcesNew(newFormValues);
  }
  return getUpdatedApplicationResources(newFormValues, oldFormValues);
}

function getCreatedApplicationResourcesNew(
  formValues: ApplicationFormValues
): Array<Summary> {
  // app summary
  const appSummary: Summary = {
    action: 'Create',
    kind: formValues.ApplicationType,
    name: formValues.Name,
  };

  // service summaries
  const serviceFormSummaries: Array<Summary> =
    formValues.Services?.map((service) => ({
      action: 'Create',
      kind: 'Service',
      name: service.Name || '',
      type: service.Type,
    })) || [];
  // statefulsets require a headless service (https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#limitations)
  // create a headless service summary if the application is a statefulset
  const headlessSummary: Array<Summary> =
    formValues.ApplicationType === 'StatefulSet'
      ? [
          {
            action: 'Create',
            kind: 'Service',
            name: `headless-${formValues.Name}`,
            type: 'ClusterIP',
          },
        ]
      : [];
  const serviceSummaries = [...serviceFormSummaries, ...headlessSummary];

  // ingress summaries
  const ingressesSummaries: Array<Summary> =
    formValues.Services?.flatMap((service) => {
      // a single service port can have multiple ingress paths (and even use different ingresses)
      const servicePathsIngressNames = service.Ports.flatMap(
        (port) => port.ingressPaths?.map((path) => path.IngressName) || []
      );
      const uniqueIngressNames = [...new Set(servicePathsIngressNames)];
      return uniqueIngressNames.map((ingressName) => ({
        action: 'Update',
        kind: 'Ingress',
        name: ingressName || '',
      }));
    }) || [];

  // persistent volume claim (pvc) summaries
  const pvcSummaries: Array<Summary> = getPVCSummaries(formValues);

  // horizontal pod autoscaler summaries
  const hpaSummary: Array<Summary> =
    formValues.AutoScaler?.isUsed === true &&
    formValues.DeploymentType !== 'Global'
      ? [
          {
            action: 'Create',
            kind: 'HorizontalPodAutoscaler',
            name: formValues.Name,
          },
        ]
      : [];

  return [
    appSummary,
    ...serviceSummaries,
    ...ingressesSummaries,
    ...pvcSummaries,
    ...hpaSummary,
  ];
}

function getUpdatedApplicationResources(
  newFormValues: ApplicationFormValues,
  oldFormValues: ApplicationFormValues
) {
  // app summaries
  const updateAppSummaries: Array<Summary> =
    oldFormValues.ApplicationType !== newFormValues.ApplicationType
      ? [
          {
            action: 'Delete',
            kind: oldFormValues.ApplicationType,
            name: oldFormValues.Name,
          },
          {
            action: 'Create',
            kind: newFormValues.ApplicationType,
            name: newFormValues.Name,
          },
        ]
      : [
          {
            action: 'Update',
            kind: newFormValues.ApplicationType,
            name: newFormValues.Name,
          },
        ];

  // service summaries
  const serviceSummaries: Array<Summary> = getServiceUpdateResourceSummary(
    oldFormValues.Services,
    newFormValues.Services
  );

  // ingress summaries
  const oldServicePorts = oldFormValues.Services?.flatMap(
    (service) => service.Ports
  );
  const oldIngresses = generateNewIngressesFromFormPaths(
    oldFormValues.OriginalIngresses,
    oldServicePorts,
    oldServicePorts
  );
  const newServicePorts = newFormValues.Services?.flatMap(
    (service) => service.Ports
  );
  const newIngresses = generateNewIngressesFromFormPaths(
    newFormValues.OriginalIngresses,
    newServicePorts,
    oldServicePorts
  );
  const ingressSummaries = getIngressUpdateSummary(oldIngresses, newIngresses);

  // persistent volume claim (pvc) summaries
  const pvcSummaries: Array<Summary> = getPVCSummaries(
    newFormValues,
    oldFormValues
  );

  // TODO: horizontal pod autoscaler summaries
  const createHPASummary: Array<Summary> =
    newFormValues.AutoScaler?.isUsed && !oldFormValues.AutoScaler?.isUsed
      ? [
          {
            action: 'Create',
            kind: 'HorizontalPodAutoscaler',
            name: newFormValues.Name,
          },
        ]
      : [];
  const deleteHPASummary: Array<Summary> =
    !newFormValues.AutoScaler?.isUsed && oldFormValues.AutoScaler?.isUsed
      ? [
          {
            action: 'Delete',
            kind: 'HorizontalPodAutoscaler',
            name: oldFormValues.Name,
          },
        ]
      : [];
  const isHPAUpdated =
    newFormValues.AutoScaler?.isUsed &&
    oldFormValues.AutoScaler?.isUsed &&
    (newFormValues.AutoScaler?.minReplicas !==
      oldFormValues.AutoScaler?.minReplicas ||
      newFormValues.AutoScaler?.maxReplicas !==
        oldFormValues.AutoScaler?.maxReplicas ||
      newFormValues.AutoScaler?.targetCpuUtilizationPercentage !==
        oldFormValues.AutoScaler?.targetCpuUtilizationPercentage);
  const updateHPASummary: Array<Summary> = isHPAUpdated
    ? [
        {
          action: 'Update',
          kind: 'HorizontalPodAutoscaler',
          name: newFormValues.Name,
        },
      ]
    : [];
  const hpaSummaries = [
    ...createHPASummary,
    ...deleteHPASummary,
    ...updateHPASummary,
  ];

  return [
    ...updateAppSummaries,
    ...serviceSummaries,
    ...ingressSummaries,
    ...pvcSummaries,
    ...hpaSummaries,
  ];
}

function getPVCSummaries(
  newFormValues: ApplicationFormValues,
  oldFormValues?: ApplicationFormValues
): Array<Summary> {
  // only create pvc summaries for new pvcs
  const newVolumeClaims =
    newFormValues.PersistedFolders?.filter((volume) => {
      // if the volume is an existing volume
      if (volume.existingVolume?.PersistentVolumeClaim.Name) {
        return false;
      }
      // to be sure the volume is new, check if it was in the old form values
      const oldVolume = oldFormValues?.PersistedFolders?.find(
        (oldVolume) =>
          oldVolume.persistentVolumeClaimName ===
          volume.persistentVolumeClaimName
      );
      if (oldVolume) {
        return false;
      }
      return true;
    }) || [];

  if (newFormValues.DataAccessPolicy === 'Shared') {
    return newVolumeClaims.map((newVolume) => {
      const name =
        newVolume.existingVolume?.PersistentVolumeClaim.Name ||
        newVolume.persistentVolumeClaimName ||
        '';
      return {
        action: 'Create',
        kind: 'PersistentVolumeClaim',
        name,
      };
    });
  }

  if (newFormValues.DataAccessPolicy === 'Isolated') {
    // apps with a isolated data access policy are statefulsets.
    // statefulset pvcs are defined in spec.volumeClaimTemplates.
    // they aren't directly created with manifests, but are created when the statefulset is created (1 PVC PER POD), so should be included
    // https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#stable-storage

    // for each volume claim, there is a PVC created per pod
    const newFormReplicas = newFormValues.ReplicaCount || 0;
    const newPVCAppendedIndexStrings = Array.from(
      { length: newFormReplicas },
      (_, i) => i
    );
    const PVCSummariesFromNewVolumeClaims: Summary[] = newVolumeClaims.flatMap(
      (volume) =>
        newPVCAppendedIndexStrings.map((appendedIndex) => {
          const prefixName =
            volume.existingVolume?.PersistentVolumeClaim.Name ||
            volume.persistentVolumeClaimName ||
            '';
          return {
            action: 'Create',
            kind: 'PersistentVolumeClaim',
            // name in the same way that the statefulset would name it
            name: `${prefixName}-${newFormValues.Name}-${appendedIndex}`,
          };
        })
    );
    // kubernetes blocks editing statefulset volume claims, so we don't need to handle updating them
    return PVCSummariesFromNewVolumeClaims;
  }

  return [];
}

// getServiceUpdateResourceSummary replicates KubernetesServiceService.patch
function getServiceUpdateResourceSummary(
  oldServices?: Array<ServiceFormValues>,
  newServices?: Array<ServiceFormValues>
): Array<Summary> {
  const updateAndCreateSummaries =
    newServices?.flatMap<Summary>((newService) => {
      const oldServiceMatched = oldServices?.find(
        (oldService) => oldService.Name === newService.Name
      );
      if (oldServiceMatched) {
        return getServiceUpdateSummary(oldServiceMatched, newService);
      }
      return [
        {
          action: 'Create',
          kind: 'Service',
          name: newService.Name || '',
          type: newService.Type || 'ClusterIP',
        },
      ];
    }) || [];

  const deleteSummaries =
    oldServices?.flatMap<Summary>((oldService) => {
      const newServiceMatched = newServices?.find(
        (newService) => newService.Name === oldService.Name
      );
      if (newServiceMatched) {
        return [];
      }
      return [
        {
          action: 'Delete',
          kind: 'Service',
          name: oldService.Name || '',
          type: oldService.Type || 'ClusterIP',
        },
      ];
    }) || [];

  return [...updateAndCreateSummaries, ...deleteSummaries];
}

function getServiceUpdateSummary(
  oldService: ServiceFormValues,
  newService: ServiceFormValues
): Array<Summary> {
  const payload = getServicePatchPayload(oldService, newService);
  if (payload.length) {
    return [
      {
        action: 'Update',
        kind: 'Service',
        name: oldService.Name || '',
        type: oldService.Type || 'ClusterIP',
      },
    ];
  }
  return [];
}

export function getIngressUpdateSummary(
  oldIngresses: Array<Ingress>,
  newIngresses: Array<Ingress>
): Array<Summary> {
  const ingressesSummaries = newIngresses.flatMap((newIng) => {
    const oldIng = oldIngresses.find((oldIng) => oldIng.Name === newIng.Name);
    if (oldIng) {
      return getIngressUpdateResourceSummary(oldIng, newIng);
    }
    return [];
  });
  return ingressesSummaries;
}

// getIngressUpdateResourceSummary checks if any ingress paths have been changed
function getIngressUpdateResourceSummary(
  oldIngress: Ingress,
  newIngress: Ingress
): Array<Summary> {
  const newIngressPaths = newIngress.Paths?.flatMap((path) => path.Path) || [];
  const oldIngressPaths = oldIngress.Paths?.flatMap((path) => path.Path) || [];
  const isAnyNewPathMissingOldPath = newIngressPaths.some(
    (path) => !oldIngressPaths.includes(path)
  );
  const isAnyOldPathMissingNewPath = oldIngressPaths.some(
    (path) => !newIngressPaths.includes(path)
  );
  if (isAnyNewPathMissingOldPath || isAnyOldPathMissingNewPath) {
    return [
      {
        action: 'Update',
        kind: 'Ingress',
        name: oldIngress.Name,
      },
    ];
  }
  return [];
}
