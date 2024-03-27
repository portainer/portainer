import { StorageClass } from '@/kubernetes/models/storage-class/StorageClass';
import { Volume } from '@/kubernetes/models/volume/Volume';

export type StorageClassViewModel = StorageClass & {
  size: 0;
  Volumes: Array<Volume>;
};
