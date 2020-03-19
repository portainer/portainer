/**
 * KubernetesPersistentVolumeClaim Model
 */
const _KubernetesPersistentVolumeClaim = Object.freeze({
  Name: '',
  Namespace: '',
  Storage: 0,
  StorageClass: {}, // KubernetesStorageClass
  CreationDate: ''
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
