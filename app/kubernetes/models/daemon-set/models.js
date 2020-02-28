/**
 * KubernetesDaemonSet Model
 */
const _KubernetesDaemonSet = Object.freeze({
  Namespace: '',
  Name: '',
  StackName: '',
  Image: '',
  Env: [],
  CpuLimit: 0,
  MemoryLimit: 0,
  VoluemMounts: [],
  Volumes: [],
  Secret: undefined
});

export class KubernetesDaemonSet {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDaemonSet)));
  }
}