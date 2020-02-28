import { KubernetesDaemonSet } from "Kubernetes/models/daemon-set/models";
import { KubernetesDaemonSetCreatePayload } from "Kubernetes/models/daemon-set/payloads";
import { KubernetesApplicationStackAnnotationKey } from "Kubernetes/models/application/models";
import KubernetesApplicationHelper from "Kubernetes/helpers/applicationHelper";

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

class KubernetesDaemonSetConverter {
  /**
   * Generate KubernetesDaemonSet from KubenetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToDaemonSet(formValues) {
    const res = new KubernetesDaemonSet();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.Image = formValues.Image;
    res.Env = [];
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = bytesValue(formValues.MemoryLimit);
    KubernetesApplicationHelper.generateEnvAndSecretFromEnvVariables(res, formValues.EnvironmentVariables);
    KubernetesApplicationHelper.generateVolumesFromPersistedFolders(res, formValues.PersistedFolders);
    return res;
  }

  /**
   * Generate CREATE payload from DaemonSet
   * @param {KubernetesDaemonSetPayload} model DaemonSet to genereate payload from
   */
  static createPayload(daemonSet) {
    const payload = new KubernetesDaemonSetCreatePayload();
    payload.metadata.name = daemonSet.Name;
    payload.metadata.namespace = daemonSet.Namespace;
    payload.metadata.annotations[KubernetesApplicationStackAnnotationKey] = daemonSet.StackName;
    payload.spec.replicas = daemonSet.ReplicaCount;
    payload.spec.selector.matchLabels.app = daemonSet.Name;
    payload.spec.template.metadata.labels.app = daemonSet.Name;
    payload.spec.template.spec.containers[0].name = daemonSet.Name;
    payload.spec.template.spec.containers[0].image = daemonSet.Image;
    payload.spec.template.spec.containers[0].env = daemonSet.Env;
    payload.spec.template.spec.containers[0].volumeMounts = daemonSet.VolumeMounts;
    payload.spec.template.spec.volumes = daemonSet.Volumes;
    if (daemonSet.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = daemonSet.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = 0;
    }
    if (daemonSet.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = daemonSet.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = 0;
    }
    return payload;
  }
}

export default KubernetesDaemonSetConverter;