/**
 * KubernetesStorageClassAccessPolicies Model
 */
const _KubernetesStorageClassAccessPolicies = Object.freeze(
[
  {
    Name: "RWO",
    Description: "Allow read-write access from a single pod only",
    selected: true,
  },
  {
    Name: "ROX",
    Description: "Allow read-only access from one or more pods simultaneously",
    selected: false,
  },
  {
    Name: "RWX",
    Description: "Allow read-write access from one or more pods simultaneously",
    selected: false,
  }
]);

export function KubernetesStorageClassAccessPolicies() {
  return JSON.parse(JSON.stringify(_KubernetesStorageClassAccessPolicies));
}

/**
 * KubernetesStorageClass Model
 */
const _KubernetesStorageClass = Object.freeze({
  Name: '',
  AccessModes: []
});

export class KubernetesStorageClass {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStorageClass)));
  }
}