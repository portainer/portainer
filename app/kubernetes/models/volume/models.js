/**
 * KubernetesPersistentVolumeClaim Model
 */
const _KubernetesPersistentVolumeClaim = Object.freeze({
  Id: '',
  Name: '',
  Namespace: '',
  Storage: 0,
  StorageClass: {}, // KubernetesStorageClass
  CreationDate: '',
  ApplicationOwner: '',
  Yaml: ''
});

export class KubernetesPersistentVolumeClaim {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumeClaim)));
  }
}

/**
 * KubernetesVolume Model
 */
const _KubernetesVolume = Object.freeze({
  ResourcePool: {}, // KubernetesResourcePool
  PersistentVolumeClaim: {}, // KubernetesPersistentVolumeClaim
  Applications: [] // KubernetesApplication
});

export class KubernetesVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesVolume)));
  }
}
