import _ from 'lodash-es';
import { KubernetesResourceTypes, KubernetesResourceActions } from 'Kubernetes/models/resource-types/models';
import { KubernetesApplicationFormValues } from 'Kubernetes/models/application/formValues';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesService, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models/appConstants';
import { KubernetesHorizontalPodAutoScalerConverter } from 'Kubernetes/horizontal-pod-auto-scaler/converter';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import KubernetesServiceConverter from 'Kubernetes/converters/service';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import { generateNewIngressesFromFormPaths } from '@/react/kubernetes/applications/CreateView/application-services/utils';

const { CREATE, UPDATE, DELETE } = KubernetesResourceActions;

/**
 * Get summary of Kubernetes resources to be created, updated or deleted
 * @param {KubernetesApplicationFormValues} formValues
 */
export function getApplicationResources(formValues, oldFormValues = {}) {
  if (oldFormValues instanceof KubernetesApplicationFormValues) {
    const resourceSummary = getUpdatedApplicationResources(oldFormValues, formValues);
    return resourceSummary;
  }
  const resourceSummary = getCreatedApplicationResources(formValues);
  return resourceSummary;
}

/**
 * Get summary of Kubernetes resources to be created
 * @param {KubernetesApplicationFormValues} formValues
 */
export function getCreatedApplicationResources(formValues) {
  const resources = [];

  let [app, headlessService, services, service, claims] = KubernetesApplicationConverter.applicationFormValuesToApplication(formValues);

  if (services) {
    services.forEach((service) => {
      resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: service.Name, type: service.Type || KubernetesServiceTypes.CLUSTER_IP });
      // Ingress
      const newServicePorts = formValues.Services.flatMap((service) => service.Ports);
      const newIngresses = generateNewIngressesFromFormPaths(formValues.OriginalIngresses, newServicePorts);
      resources.push(...getIngressUpdateSummary(formValues.OriginalIngresses, newIngresses));
    });
  }

  if (service) {
    // Service
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: service.Name, type: service.Type || KubernetesServiceTypes.CLUSTER_IP });
  }

  if (app instanceof KubernetesStatefulSet) {
    // Service
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: headlessService.Name, type: headlessService.Type || KubernetesServiceTypes.CLUSTER_IP });
  } else {
    // Persistent volume claims
    const persistentVolumeClaimResources = claims
      .filter((pvc) => !pvc.PreviousName && !pvc.Id)
      .map((pvc) => ({ action: CREATE, kind: KubernetesResourceTypes.PERSISTENT_VOLUME_CLAIM, name: pvc.Name }));
    resources.push(...persistentVolumeClaimResources);
  }

  // Horizontal pod autoscalers
  if (formValues.AutoScaler.IsUsed && formValues.DeploymentType !== KubernetesApplicationDeploymentTypes.Global) {
    const kind = app.ApplicationType;
    const autoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(formValues, kind);
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: autoScaler.Name });
  }

  // Deployment
  const appResourceType = app.ApplicationType;
  if (appResourceType !== null) {
    resources.push({ action: CREATE, kind: appResourceType, name: app.Name });
  }

  return resources;
}

/**
 * Get summary of Kubernetes resources to be created, updated and/or deleted
 * @param {KubernetesApplicationFormValues} oldFormValues
 * @param {KubernetesApplicationFormValues} newFormValues
 */
export function getUpdatedApplicationResources(oldFormValues, newFormValues) {
  const resources = [];

  const [oldApp, oldHeadlessService, oldServices, oldService, oldClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(oldFormValues);
  const [newApp, newHeadlessService, newServices, newService, newClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(newFormValues);
  const oldAppResourceType = oldApp.ApplicationType;
  const newAppResourceType = newApp.ApplicationType;

  if (oldAppResourceType !== newAppResourceType) {
    // Deployment
    resources.push({ action: DELETE, kind: oldAppResourceType, name: oldApp.Name });
    if (oldService && oldServices) {
      // Service
      resources.push({ action: DELETE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP });
    }
    // re-creation of resources
    const createdApplicationResourceSummary = getCreatedApplicationResources(newFormValues);
    resources.push(...createdApplicationResourceSummary);
    return resources;
  }

  if (newApp instanceof KubernetesStatefulSet) {
    const headlessServiceUpdateResourceSummary = getServiceUpdateResourceSummary(oldHeadlessService, newHeadlessService);
    if (headlessServiceUpdateResourceSummary) {
      resources.push(headlessServiceUpdateResourceSummary);
    }
  } else {
    // Persistent volume claims
    const claimSummaries = newClaims
      .map((pvc) => {
        if (!pvc.PreviousName && !pvc.Id) {
          return { action: CREATE, kind: KubernetesResourceTypes.PERSISTENT_VOLUME_CLAIM, name: pvc.Name };
        } else if (!pvc.Id) {
          const oldClaim = _.find(oldClaims, { Name: pvc.PreviousName });
          return getVolumeClaimUpdateResourceSummary(oldClaim, pvc);
        }
      })
      .filter((pvc) => pvc); // remove nulls
    resources.push(...claimSummaries);
  }

  // Deployment
  resources.push({ action: UPDATE, kind: oldAppResourceType, name: oldApp.Name });

  if (oldServices && newServices) {
    // Service
    const serviceUpdateResourceSummary = getServiceUpdateResourceSummary(oldServices, newServices);
    if (serviceUpdateResourceSummary !== null) {
      serviceUpdateResourceSummary.forEach((updateSummary) => {
        resources.push(updateSummary);
      });
    }

    // Ingress
    const oldServicePorts = oldFormValues.Services.flatMap((service) => service.Ports);
    const oldIngresses = generateNewIngressesFromFormPaths(oldFormValues.OriginalIngresses, oldServicePorts, oldServicePorts);
    const newServicePorts = newFormValues.Services.flatMap((service) => service.Ports);
    const newIngresses = generateNewIngressesFromFormPaths(newFormValues.OriginalIngresses, newServicePorts, oldServicePorts);
    resources.push(...getIngressUpdateSummary(oldIngresses, newIngresses));
  } else if (!oldService && newService) {
    // Service
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: newService.Name, type: newService.Type || KubernetesServiceTypes.CLUSTER_IP });
  } else if (oldService && !newService) {
    // Service
    resources.push({ action: DELETE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP });
  }

  const newKind = newApp.ApplicationType;
  const newAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(newFormValues, newKind);
  if (!oldFormValues.AutoScaler.IsUsed) {
    if (newFormValues.AutoScaler.IsUsed) {
      // Horizontal pod autoscalers
      resources.push({ action: CREATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: newAutoScaler.Name });
    }
  } else {
    // Horizontal pod autoscalers
    const oldKind = oldApp.ApplicationType;
    const oldAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(oldFormValues, oldKind);
    if (newFormValues.AutoScaler.IsUsed) {
      const hpaUpdateSummary = getHorizontalPodAutoScalerUpdateResourceSummary(oldAutoScaler, newAutoScaler);
      if (hpaUpdateSummary) {
        resources.push(hpaUpdateSummary);
      }
    } else {
      resources.push({ action: DELETE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: oldAutoScaler.Name });
    }
  }

  return resources;
}

function getIngressUpdateSummary(oldIngresses, newIngresses) {
  const ingressesSummaries = newIngresses
    .map((newIng) => {
      const oldIng = oldIngresses.find((oldIng) => oldIng.Name === newIng.Name);
      return getIngressUpdateResourceSummary(oldIng, newIng);
    })
    .filter((s) => s); // remove nulls
  return ingressesSummaries;
}

// getIngressUpdateResourceSummary replicates KubernetesIngressService.patch
function getIngressUpdateResourceSummary(oldIngress, newIngress) {
  const payload = KubernetesIngressConverter.patchPayload(oldIngress, newIngress);
  if (payload.length) {
    return { action: UPDATE, kind: KubernetesResourceTypes.INGRESS, name: oldIngress.Name };
  }
  return null;
}

// getVolumeClaimUpdateResourceSummary replicates KubernetesPersistentVolumeClaimService.patch
function getVolumeClaimUpdateResourceSummary(oldPVC, newPVC) {
  const payload = KubernetesPersistentVolumeClaimConverter.patchPayload(oldPVC, newPVC);
  if (payload.length) {
    return { action: UPDATE, kind: KubernetesResourceTypes.PERSISTENT_VOLUME_CLAIM, name: oldPVC.Name };
  }
  return null;
}

// getServiceUpdateResourceSummary replicates KubernetesServiceService.patch
function getServiceUpdateResourceSummary(oldServices, newServices) {
  let summary = [];
  // skip update summary when service is headless service
  if (!oldServices.Headless) {
    newServices.forEach((newService) => {
      const oldServiceMatched = _.find(oldServices, { Name: newService.Name });
      if (oldServiceMatched) {
        const payload = KubernetesServiceConverter.patchPayload(oldServiceMatched, newService);
        if (payload.length) {
          const serviceUpdate = {
            action: UPDATE,
            kind: KubernetesResourceTypes.SERVICE,
            name: oldServiceMatched.Name,
            type: oldServiceMatched.Type || KubernetesServiceTypes.CLUSTER_IP,
          };
          summary.push(serviceUpdate);
        }
      } else {
        const emptyService = new KubernetesService();
        const payload = KubernetesServiceConverter.patchPayload(emptyService, newService);
        if (payload.length) {
          const serviceCreate = { action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: newService.Name, type: newService.Type || KubernetesServiceTypes.CLUSTER_IP };
          summary.push(serviceCreate);
        }
      }
    });

    oldServices.forEach((oldService) => {
      const newServiceMatched = _.find(newServices, { Name: oldService.Name });
      if (!newServiceMatched) {
        const serviceDelete = { action: DELETE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP };
        summary.push(serviceDelete);
      }
    });
  }
  if (summary.length !== 0) {
    return summary;
  }
  return null;
}

// getHorizontalPodAutoScalerUpdateResourceSummary replicates KubernetesHorizontalPodAutoScalerService.patch
function getHorizontalPodAutoScalerUpdateResourceSummary(oldHorizontalPodAutoScaler, newHorizontalPodAutoScaler) {
  const payload = KubernetesHorizontalPodAutoScalerConverter.patchPayload(oldHorizontalPodAutoScaler, newHorizontalPodAutoScaler);
  if (payload.length) {
    return { action: UPDATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: oldHorizontalPodAutoScaler.Name };
  }
  return null;
}
