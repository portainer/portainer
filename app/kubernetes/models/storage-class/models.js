export { StorageClass as KubernetesStorageClass } from './StorageClass';

/**
 * KubernetesStorageClassAccessPolicies Model
 */
const _KubernetesStorageClassAccessPolicies = Object.freeze([
  {
    Name: 'ReadWriteOnce',
    Description: 'Allow read-write from a single pod only (RWO)',
    selected: true,
  },
  {
    Name: 'ReadWriteMany',
    Description: 'Allow read-write access from one or more pods concurrently (RWX)',
    selected: false,
  },
]);

export function KubernetesStorageClassAccessPolicies() {
  return JSON.parse(JSON.stringify(_KubernetesStorageClassAccessPolicies));
}
