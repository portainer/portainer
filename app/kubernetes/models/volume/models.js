import uuidv4 from 'uuid/v4';
/**
 * KubernetesPersistentVolumeClaim Model
 */
const _KubernetesPersistentVolumeClaim = Object.freeze({
  Id: '',
  Name: '',
  PreviousName: '',
  Namespace: '',
  Storage: 0,
  StorageClass: {}, // KubernetesStorageClass
  CreationDate: '',
  ApplicationOwner: '',
  ApplicationName: '',
  MountPath: '', // used for Application creation from ApplicationFormValues | not used from API conversion
  Yaml: '',
});

export class KubernetesPersistentVolumeClaim {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumeClaim)));
    this.Name = uuidv4();
  }
}

/**
 * KubernetesPV Model
 */
const _KubernetesPV = Object.freeze({
  Name: '',
  ResourcePool: {}, // KubernetesResourcePool
  StorageClass: {}, // KubernetesStorageClass
  Size: '',
  NFS: false,
  NFSAddress: '',
  NFSVersion: '',
  NFSMountPoint: '',
  NFSOptions: '',
});

export class KubernetesPV {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPV)));
  }
}

/**
 * KubernetesVolume Model (Composite)
 */
const _KubernetesVolume = Object.freeze({
  ResourcePool: {}, // KubernetesResourcePool
  PersistentVolumeClaim: {}, // KubernetesPersistentVolumeClaim
  Applications: [], // KubernetesApplication
});

export class KubernetesVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesVolume)));
  }
}
