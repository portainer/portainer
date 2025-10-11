import { StorageClass } from '../storage-class/StorageClass';

export class PersistentVolumeClaim {
  Id: string = crypto.randomUUID();

  Name: string = '';

  PreviousName: string = '';

  Namespace: string = '';

  Storage: number = 0;

  storageClass?: StorageClass; // KubernetesStorageClass

  CreationDate: string = '';

  ApplicationOwner: string = '';

  AccessModes: Array<unknown> = [];

  ApplicationName: string = '';

  /**
   * used for Application creation from `ApplicationFormValues`
   *  not used from API conversion
   */
  MountPath: string = '';

  Yaml: string = '';
}
