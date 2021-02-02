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
  PersistentVolumeName: '', // Name of KubernetesPersistentVolume
  Yaml: '',
});

export class KubernetesPersistentVolumeClaim {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumeClaim)));
    this.Name = uuidv4();
  }
}

/**
 * KubernetesPersistentVolume Model
 */
const _KubernetesPersistentVolume = Object.freeze({
  Id: '',
  Name: '',
  StorageClass: {}, // KubernetesStorageClass
  Size: '',
  NFSAddress: '',
  NFSMountPoint: '',
});

export class KubernetesPersistentVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolume)));
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
