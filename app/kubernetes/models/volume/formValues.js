/**
 * KubernetesApplicationFormValues Model
 */
const _KubernetesVolumeFormValues = Object.freeze({
  Name: '',
  ResourcePool: {},
  StorageClass: {},
  Size: '',
  SizeUnit: 'GB',
  NFS: false,
  NFSAddress: '',
  NFSVersion: '',
  NFSMountPoint: '',
  NFSOptions: '',
});

export class KubernetesVolumeFormValues {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesVolumeFormValues)));
  }
}
