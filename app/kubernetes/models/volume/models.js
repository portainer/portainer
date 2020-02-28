/**
 * KubernetesPersistentVolumeClaim Model
 */
const _KubernetesPersistentVolumeClaim = Object.freeze({
  Name: '',
  Namespace: '',
  StackName: '',
  Storage: 0,
  StorageClass: ''
});

export class KubernetesPersistentVolumeClaim {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumeClaim)));
  }
}