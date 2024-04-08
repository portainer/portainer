import uuidv4 from 'uuid/v4';

import { StorageClass } from '../storage-class/StorageClass';

export class PersistentVolumeClaim {
  Id: string = uuidv4();

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
