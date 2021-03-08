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
  StorageClass: undefined, // KubernetesStorageClass
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
export function KubernetesPersistentVolume() {
  return {
    Id: '',
    Name: '',
    StorageClass: {}, // KubernetesStorageClass
    Size: '',
    NFSAddress: '',
    NFSMountPoint: '',
  };
}

/**
 * KubernetesVolume Model (Composite)
 */
const _KubernetesVolume = Object.freeze({
  ResourcePool: {}, // KubernetesResourcePool
  PersistentVolumeClaim: {}, // KubernetesPersistentVolumeClaim
  PersistentVolume: undefined, // KubernetesPersistentVolume
  Applications: [], // KubernetesApplication
});

export class KubernetesVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesVolume)));
  }
}
