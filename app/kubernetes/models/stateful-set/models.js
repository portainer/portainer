/**
 * KubernetesStatefulSet Model
 */
const _KubernetesStatefulSet = Object.freeze({
  Namespace: '',
  Name: '',
  StackName: '',
  ReplicaCount: 0,
  Image: '',
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
});

export class KubernetesStatefulSet {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStatefulSet)));
  }
}
