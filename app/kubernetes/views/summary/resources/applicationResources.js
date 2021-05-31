import _ from 'lodash-es';
import { KubernetesResourceTypes, KubernetesResourceActions } from 'Kubernetes/models/resource-types/models';
import { KubernetesApplicationFormValues } from 'Kubernetes/models/application/formValues';
import { KubernetesDeployment } from 'Kubernetes/models/deployment/models';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import {
  KubernetesApplication,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationTypes,
} from 'Kubernetes/models/application/models';
import { KubernetesHorizontalPodAutoScalerHelper } from 'Kubernetes/horizontal-pod-auto-scaler/helper';
import { KubernetesHorizontalPodAutoScalerConverter } from 'Kubernetes/horizontal-pod-auto-scaler/converter';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';

const { CREATE, UPDATE, DELETE } = KubernetesResourceActions;

/**
 * Get summary of Kubernetes resources to be created, updated or deleted
 * @param {KubernetesApplicationFormValues} formValues
 */
export default function (formValues, oldFormValues = {}) {
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
function getCreatedApplicationResources(formValues) {
  const resources = [];

  let [app, headlessService, service, claims] = KubernetesApplicationConverter.applicationFormValuesToApplication(formValues);

  if (service) {
    // Service
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: service.Name, type: service.Type || KubernetesServiceTypes.CLUSTER_IP });
    if (formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      // Ingress
      const ingresses = KubernetesIngressConverter.applicationFormValuesToIngresses(formValues, service.Name);
      resources.push(...getIngressUpdateSummary(formValues.OriginalIngresses, ingresses));
    }
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
  if (formValues.AutoScaler.IsUsed && formValues.DeploymentType !== KubernetesApplicationDeploymentTypes.GLOBAL) {
    const kind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(app);
    const autoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(formValues, kind);
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: autoScaler.Name });
  }

  // Deployment
  const appResourceType = getApplicationResourceType(app);
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
function getUpdatedApplicationResources(oldFormValues, newFormValues) {
  const resources = [];

  const [oldApp, oldHeadlessService, oldService, oldClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(oldFormValues);
  const [newApp /* newHeadlessService */, , newService, newClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(newFormValues);

  const oldAppResourceType = getApplicationResourceType(oldApp);
  const newAppResourceType = getApplicationResourceType(newApp);

  if (oldAppResourceType !== newAppResourceType) {
    // Deployment
    resources.push({ action: DELETE, kind: oldAppResourceType, name: oldApp.Name });
    if (oldService) {
      // Service
      resources.push({ action: DELETE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP });
    }
    // re-creation of resources
    const createdApplicationResourceSummary = getCreatedApplicationResources(newFormValues);
    resources.push(...createdApplicationResourceSummary);
  }

  if (newApp instanceof KubernetesStatefulSet) {
    // Service
    resources.push({ action: UPDATE, kind: KubernetesResourceTypes.SERVICE, name: oldHeadlessService.Name, type: oldHeadlessService.Type || KubernetesServiceTypes.CLUSTER_IP });
  } else {
    // Persistent volume claims
    const claimSummaries = newClaims.map((pvc) => {
      if (!pvc.PreviousName && !pvc.Id) {
        resources.push({ action: CREATE, kind: KubernetesResourceTypes.PERSISTENT_VOLUME_CLAIM, name: pvc.Name });
      } else if (!pvc.Id) {
        const oldClaim = _.find(oldClaims, { Name: pvc.PreviousName });
        resources.push({ action: UPDATE, kind: KubernetesResourceTypes.PERSISTENT_VOLUME_CLAIM, name: oldClaim.Name });
      }
    });
    resources.push(...claimSummaries);
  }

  // Deployment
  resources.push({ action: UPDATE, kind: oldAppResourceType, name: oldApp.Name });

  if (oldService && newService) {
    // Service
    resources.push({ action: UPDATE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP });
    if (newFormValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS || oldFormValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      // Ingress
      const oldIngresses = KubernetesIngressConverter.applicationFormValuesToIngresses(oldFormValues, oldService.Name);
      const newIngresses = KubernetesIngressConverter.applicationFormValuesToIngresses(newFormValues, newService.Name);
      resources.push(...getIngressUpdateSummary(oldIngresses, newIngresses));
    }
  } else if (!oldService && newService) {
    // Service
    resources.push({ action: CREATE, kind: KubernetesResourceTypes.SERVICE, name: newService.Name, type: newService.Type || KubernetesServiceTypes.CLUSTER_IP });
    if (newFormValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      // Ingress
      const ingresses = KubernetesIngressConverter.applicationFormValuesToIngresses(newFormValues, newService.Name);
      resources.push(...getIngressUpdateSummary(newFormValues.OriginalIngresses, ingresses));
    }
  } else if (oldService && !newService) {
    // Service
    resources.push({ action: DELETE, kind: KubernetesResourceTypes.SERVICE, name: oldService.Name, type: oldService.Type || KubernetesServiceTypes.CLUSTER_IP });
    if (oldFormValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      // Ingress
      const ingresses = KubernetesIngressConverter.applicationFormValuesToIngresses(newFormValues, oldService.Name);
      resources.push(...getIngressUpdateSummary(oldFormValues.OriginalIngresses, ingresses));
    }
  }

  const newKind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(newApp);
  const newAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(newFormValues, newKind);
  if (!oldFormValues.AutoScaler.IsUsed) {
    if (newFormValues.AutoScaler.IsUsed) {
      // Horizontal pod autoscalers
      resources.push({ action: CREATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: newAutoScaler.Name });
    }
  } else {
    // Horizontal pod autoscalers
    const oldKind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(oldApp);
    const oldAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(oldFormValues, oldKind);
    if (newFormValues.AutoScaler.IsUsed) {
      resources.push({ action: UPDATE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: oldAutoScaler.Name });
    } else {
      resources.push({ action: DELETE, kind: KubernetesResourceTypes.HORIZONTAL_POD_AUTOSCALER, name: oldAutoScaler.Name });
    }
  }

  return resources;
}

function getApplicationResourceType(app) {
  if (app instanceof KubernetesDeployment || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT)) {
    return KubernetesResourceTypes.DEPLOYMENT;
  } else if (app instanceof KubernetesDaemonSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DAEMONSET)) {
    return KubernetesResourceTypes.DAEMONSET;
  } else if (app instanceof KubernetesStatefulSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.STATEFULSET)) {
    return KubernetesResourceTypes.STATEFULSET;
  }
  return null;
}

function getIngressUpdateSummary(oldIngresses, newIngresses) {
  return _.map(newIngresses, (newIng) => {
    const oldIng = _.find(oldIngresses, { Name: newIng.Name });
    return { action: UPDATE, kind: KubernetesResourceTypes.INGRESS, name: oldIng.Name };
  });
}
