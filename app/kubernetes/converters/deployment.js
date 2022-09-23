import * as JsonPatch from 'fast-json-patch';
import { KubernetesDeployment } from 'kubernetes/models/deployment/models';
import { KubernetesDeploymentCreatePayload } from 'kubernetes/models/deployment/payloads';
import {
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationNote,
} from 'kubernetes/models/application/models';

import KubernetesApplicationHelper from 'kubernetes/helpers/application';
import KubernetesResourceReservationHelper from 'kubernetes/helpers/resourceReservationHelper';
import KubernetesCommonHelper from 'kubernetes/helpers/commonHelper';
import { buildImageFullURI } from 'docker/helpers/imageHelper';

class KubernetesDeploymentConverter {
  /**
   * Generate KubernetesDeployment from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToDeployment(formValues, volumeClaims) {
    const res = new KubernetesDeployment();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ApplicationName = formValues.Name;
    res.ReplicaCount = formValues.ReplicaCount;
    res.ImageModel = formValues.ImageModel;
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = KubernetesResourceReservationHelper.bytesValue(formValues.MemoryLimit);
    res.Env = KubernetesApplicationHelper.generateEnvFromEnvVariables(formValues.EnvironmentVariables);
    res.Containers = formValues.Containers;
    KubernetesApplicationHelper.generateVolumesFromPersistentVolumClaims(res, volumeClaims);
    KubernetesApplicationHelper.generateEnvOrVolumesFromConfigurations(res, formValues.Configurations);
    KubernetesApplicationHelper.generateAffinityFromPlacements(res, formValues);
    return res;
  }

  /**
   * Generate CREATE payload from Deployment
   * @param {KubernetesDeploymentPayload} model Deployment to genereate payload from
   */
  static createPayload(deployment) {
    const payload = new KubernetesDeploymentCreatePayload();
    payload.metadata.name = deployment.Name;
    payload.metadata.namespace = deployment.Namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = deployment.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = deployment.ApplicationName;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = deployment.ApplicationOwner;
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = deployment.Note;
    payload.spec.replicas = deployment.ReplicaCount;
    payload.spec.selector.matchLabels.app = deployment.Name;
    payload.spec.template.metadata.labels.app = deployment.Name;
    payload.spec.template.metadata.labels[KubernetesPortainerApplicationNameLabel] = deployment.ApplicationName;
    payload.spec.template.spec.containers[0].name = deployment.Name;

    if (deployment.ImageModel) {
      payload.spec.template.spec.containers[0].image = buildImageFullURI(deployment.ImageModel);

      if (deployment.ImageModel.Registry && deployment.ImageModel.Registry.Authentication) {
        payload.spec.template.spec.imagePullSecrets = [{ name: `registry-${deployment.ImageModel.Registry.Id}` }];
      }
    }

    payload.spec.template.spec.affinity = deployment.Affinity;
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].env', deployment.Env);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].volumeMounts', deployment.VolumeMounts);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.volumes', deployment.Volumes);
    if (deployment.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = deployment.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = deployment.MemoryLimit;
    }
    if (deployment.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = deployment.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = deployment.CpuLimit;
    }
    if (!deployment.CpuLimit && !deployment.MemoryLimit) {
      delete payload.spec.template.spec.containers[0].resources;
    }
    return payload;
  }

  static patchPayload(oldDeployment, newDeployment) {
    const oldPayload = KubernetesDeploymentConverter.createPayload(oldDeployment);
    const newPayload = KubernetesDeploymentConverter.createPayload(newDeployment);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesDeploymentConverter;
