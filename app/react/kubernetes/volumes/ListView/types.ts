import { StorageClass } from '@/kubernetes/models/storage-class/StorageClass';
import { Volume } from '@/kubernetes/models/volume/Volume';

import { K8sVolOwningApplication } from '../types';

export interface VolumeViewModel {
  Applications: K8sVolOwningApplication[];
  PersistentVolumeClaim: {
    Name: string;
    storageClass: {
      Name: string;
    };
    Storage?: unknown;
    CreationDate?: string;
    ApplicationOwner?: string;
  };
  ResourcePool: {
    Namespace: {
      Name: string;
    };
  };
}

export type StorageClassViewModel = StorageClass & {
  size: number;
  Volumes: Array<Volume>;
};
