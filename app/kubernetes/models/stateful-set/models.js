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
  Secret: '',
  VolumeMounts: [],
  Volumes: [],
  VolumeClaims: [],
  ServiceName: ''
});

export class KubernetesStatefulSet {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStatefulSet)));
  }
}