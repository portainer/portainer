import { KubernetesDaemonSet } from "Kubernetes/models/daemon-set/models";
import { KubernetesDaemonSetCreatePayload } from "Kubernetes/models/daemon-set/payloads";
import { KubernetesApplicationStackAnnotationKey } from "Kubernetes/models/application";

class KubernetesDaemonSetConverter {
  static apiToDaemonSet() {
    const res = new KubernetesDaemonSet();
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