import { KubernetesHorizontalPodAutoScaler } from './models';

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
}
