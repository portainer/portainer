import { StorageClass } from '@/kubernetes/models/storage-class/StorageClass';
import { Volume } from '@/kubernetes/models/volume/Volume';

export interface VolumeViewModel {
  Applications: Array<{
    Name: string;
  }>;
  PersistentVolumeClaim: {
    Name: string;
    storageClass: {
      Name: string;
    };
    Storage?: unknown;
    CreationDate: number;
    ApplicationOwner?: string;
  };
  ResourcePool: {
    Namespace: {
      Name: string;
    };
  };
}

export type StorageClassViewModel = StorageClass & {
  size: 0;
  Volumes: Array<Volume>;
};
