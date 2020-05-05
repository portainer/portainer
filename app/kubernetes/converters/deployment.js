import {KubernetesDeployment} from 'Kubernetes/models/deployment/models';
import {KubernetesDeploymentCreatePayload, KubernetesDeploymentPatchPayload} from 'Kubernetes/models/deployment/payloads';
import {KubernetesPortainerApplicationStackNameLabel, KubernetesPortainerApplicationNameLabel, KubernetesPortainerApplicationOwnerLabel, KubernetesPortainerApplicationNote } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

class KubernetesDeploymentConverter {
  /**
   * Generate KubernetesDeployment from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToDeployment(formValues) {
    const res = new KubernetesDeployment();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ReplicaCount = formValues.ReplicaCount;
    res.Image = formValues.Image;
    res.Env = [];
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = bytesValue(formValues.MemoryLimit);
    KubernetesApplicationHelper.generateEnvFromEnvVariables(res, formValues.EnvironmentVariables);
    KubernetesApplicationHelper.generateVolumesFromPersistedFolders(res, formValues.PersistedFolders);
    KubernetesApplicationHelper.generateEnvOrVolumesFromConfigurations(res, formValues.Configurations);
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
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = deployment.Name;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = deployment.ApplicationOwner;
    payload.spec.replicas = deployment.ReplicaCount;
    payload.spec.selector.matchLabels.app = deployment.Name;
    payload.spec.template.metadata.labels.app = deployment.Name;
    payload.spec.template.spec.containers[0].name = deployment.Name;
    payload.spec.template.spec.containers[0].image = deployment.Image;
    payload.spec.template.spec.containers[0].env = deployment.Env;
    payload.spec.template.spec.containers[0].volumeMounts = deployment.VolumeMounts;
    payload.spec.template.spec.volumes = deployment.Volumes;
    if (deployment.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = deployment.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = deployment.MemoryLimit;
    }
    if (deployment.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = deployment.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = deployment.CpuLimit;
    }
    return payload;
  }

  static patchPayload(deployment) {
    const payload = new KubernetesDeploymentPatchPayload();
    delete payload.metadata.uid;
    delete payload.metadata.name;
    delete payload.metadata.namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = deployment.StackName;
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = deployment.Note;
    return payload;
  }
}

export default KubernetesDeploymentConverter;