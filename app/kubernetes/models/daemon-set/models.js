/**
 * KubernetesDaemonSet Model
 */
const _KubernetesDaemonSet = Object.freeze({
  Namespace: '',
  Name: '',
  StackName: '',
  ImageModel: null,
  Env: [],
  CpuLimit: 0,
  MemoryLimit: 0,
  VoluemMounts: [],
  Volumes: [],
  Secret: undefined,
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Affinity: undefined, // KubernetesPodAffinity
});

export class KubernetesDaemonSet {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDaemonSet)));
  }
}
