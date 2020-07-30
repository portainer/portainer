/**
 * KubernetesStorageClassAccessPolicies Model
 */
const _KubernetesStorageClassAccessPolicies = Object.freeze([
  {
    Name: 'RWO',
    Description: 'Allow read-write from a single pod only (RWO)',
    selected: true,
  },
  {
    Name: 'RWX',
    Description: 'Allow read-write access from one or more pods concurrently (RWX)',
    selected: false,
  },
]);

export function KubernetesStorageClassAccessPolicies() {
  return JSON.parse(JSON.stringify(_KubernetesStorageClassAccessPolicies));
}

/**
 * KubernetesStorageClass Model
 */
const _KubernetesStorageClass = Object.freeze({
  Name: '',
  AccessModes: [],
  Provisioner: '',
  AllowVolumeExpansion: false,
});

export class KubernetesStorageClass {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStorageClass)));
  }
}
