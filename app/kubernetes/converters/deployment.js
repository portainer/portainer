import { KubernetesDeployment } from "Kubernetes/models/deployment/models";
import { KubernetesDeploymentCreatePayload } from "Kubernetes/models/deployment/payloads";
import { KubernetesApplicationStackAnnotationKey } from "Kubernetes/models/application";

class KubernetesDeploymentConverter {
  static apiToDeployment() {
    const res = new KubernetesDeployment();
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
    payload.metadata.annotations[KubernetesApplicationStackAnnotationKey] = deployment.StackName;
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
      payload.spec.template.spec.containers[0].resources.requests.memory = 0;
    }
    if (deployment.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = deployment.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = 0;
    }
    return payload;
  }
}

export default KubernetesDeploymentConverter;