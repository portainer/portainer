/**
 * KubernetesDeployment Model
 */
const _KubernetesDeployment = Object.freeze({
  Namespace: '',
  Name: '',
  StackName: '',
  ReplicaCount: 0,
  ImageModel: null,
  Env: [],
  CpuLimit: 0,
  MemoryLimit: 0,
  VolumeMounts: [],
  Volumes: [],
  Secret: undefined,
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Affinity: undefined, // KubernetesPodAffinity
});

export class KubernetesDeployment {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDeployment)));
  }
}
