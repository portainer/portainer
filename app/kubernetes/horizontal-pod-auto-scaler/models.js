/**
 * KubernetesHorizontalPodAutoScaler Model
 */
const _KubernetesHorizontalPodAutoScaler = Object.freeze({
  Id: '',
  Namespace: '',
  Name: '',
  MinReplicas: 1,
  MaxReplicas: 1,
  TargetCPUUtilization: 0,
  TargetEntity: {
    ApiVersion: '',
    Kind: '',
    Name: '',
  },
  Yaml: '',
});

export class KubernetesHorizontalPodAutoScaler {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScaler)));
  }
}
