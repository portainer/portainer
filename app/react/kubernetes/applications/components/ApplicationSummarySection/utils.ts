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
  const pvcSummaries: Array<Summary> =
    // apps with a isolated data access policy are statefulsets.
    // statefulset pvcs are defined in spec.volumeClaimTemplates.
    // https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#stable-storage
    formValues.DataAccessPolicy === 'Shared'
      ? formValues.PersistedFolders?.filter(
          // only create pvc summaries for new pvcs
          (volume) => !volume.existingVolume?.PersistentVolumeClaim.Name
        ).map((volume) => ({
          action: 'Create',
          kind: 'PersistentVolumeClaim',
          name:
            volume.existingVolume?.PersistentVolumeClaim.Name ||
            volume.persistentVolumeClaimName ||
            '',
        })) || []
      : [];

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
  const pvcSummaries: Array<Summary> =
    // apps with a isolated data access policy are statefulsets.
    // statefulset pvcs are defined in spec.volumeClaimTemplates.
    // https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#stable-storage
    newFormValues.DataAccessPolicy === 'Shared'
      ? newFormValues.PersistedFolders?.filter(
          // only create pvc summaries for new pvcs
          (volume) => !volume.existingVolume?.PersistentVolumeClaim.Name
        ).flatMap((newVolume) => {
          const oldVolume = oldFormValues.PersistedFolders?.find(
            (oldVolume) =>
              oldVolume.persistentVolumeClaimName ===
              newVolume.persistentVolumeClaimName
          );
          if (!oldVolume) {
            return [
              {
                action: 'Create',
                kind: 'PersistentVolumeClaim',
                name:
                  newVolume.existingVolume?.PersistentVolumeClaim.Name ||
                  newVolume.persistentVolumeClaimName ||
                  '',
              },
            ];
          }
          // updating a pvc is not supported
          return [];
        }) || []
      : [];

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
