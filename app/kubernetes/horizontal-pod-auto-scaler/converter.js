import { KubernetesHorizontalPodAutoScaler } from './models';
import { KubernetesHorizontalPodAutoScalerCreatePayload } from './payload';

export class KubernetesHorizontalPodAutoScalerConverter {
  /**
   * Convert API data to KubernetesHorizontalPodAutoScaler model
   */
  static apiToModel(data, yaml) {
    const res = new KubernetesHorizontalPodAutoScaler();
    res.Id = data.metadata.uid;
    res.Namespace = data.metadata.namespace;
    res.Name = data.metadata.name;
    res.MinReplicas = data.spec.minReplicas;
    res.MaxReplicas = data.spec.maxReplicas;
    res.TargetCPUUtilizationPercentage = data.spec.targetCPUUtilizationPercentage;
    if (data.spec.scaleTargetRef) {
      res.TargetEntity.ApiVersion = data.spec.scaleTargetRef.apiVersion;
      res.TargetEntity.Kind = data.spec.scaleTargetRef.kind;
      res.TargetEntity.Name = data.spec.scaleTargetRef.name;
    }
    res.Yaml = yaml ? yaml.data : '';
    return res;
  }

  static createPayload(data) {
    const payload = new KubernetesHorizontalPodAutoScalerCreatePayload();
    payload.metadata.namespace = data.Namespace;
    payload.spec.minReplicas = data.MinReplicas;
    payload.spec.maxReplicas = data.MaxReplicas;
    payload.spec.targetCPUUtilizationPercentage = data.TargetCPUUtilizationPercentage;
    payload.spec.scaleTargetRef.apiVersion = data.TargetEntity.ApiVersion;
    payload.spec.scaleTargetRef.kind = data.TargetEntity.Kind;
    payload.spec.scaleTargetRef.name = data.TargetEntity.Name;
  }
}
