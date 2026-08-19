/**
 * KubernetesStatefulSet Model
 */
const _KubernetesStatefulSet = Object.freeze({
  Namespace: '',
  Name: '',
  StackName: '',
  ReplicaCount: 0,
  ImageModel: null,
  Env: [],
  CpuLimit: '',
  MemoryLimit: '',
  VolumeMounts: [],
  Volumes: [],
  Secret: undefined,
  VolumeClaims: [],
  ServiceName: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Affinity: undefined, // KubernetesPodAffinity
});

export class KubernetesStatefulSet {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStatefulSet)));
  }
}
