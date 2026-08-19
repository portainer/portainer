import { K8sVolOwningApplication } from '../types';

export interface VolumeViewModel {
  Applications: K8sVolOwningApplication[];
  PersistentVolumeClaim: {
    Name: string;
    storageClass: {
      Name: string;
    };
    Storage?: string | number;
    CreationDate?: string;
    ApplicationOwner?: string;
    IsExternal?: boolean;
  };
  ResourcePool: {
    Namespace: {
      Name: string;
    };
  };
}

export type AccessMode =
  | 'ReadWriteOnce'
  | 'ReadOnlyMany'
  | 'ReadWriteMany'
  | 'ReadWriteOncePod';
export type ReclaimPolicy = 'Retain' | 'Recycle' | 'Delete';
export type VolumeMode = 'Filesystem' | 'Block';
export type PersistentVolumeStatus =
  | 'Available'
  | 'Bound'
  | 'Released'
  | 'Failed';
export type PersistentVolumeClaimPhase = 'Bound' | 'Pending' | 'Lost';

export interface ClaimRef {
  kind: string;
  namespace: string;
  name: string;
  uid: string;
  apiVersion: string;
  resourceVersion: string;
}

export interface PersistentVolume {
  name: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  accessModes: string[];
  humanReadableAccessModes: AccessMode[];
  capacity: {
    storage: string;
  };
  claimRef: ClaimRef | null;
  storageClassName: string;
  persistentVolumeReclaimPolicy: ReclaimPolicy;
  volumeMode?: VolumeMode;
  csi?: unknown;
  status: PersistentVolumeStatus;
  creationDate: string;
}

export interface PersistentVolumeClaim {
  id: string;
  name: string;
  namespace: string;
  storage: number;
  storageRequest: string;
  creationDate: string;
  accessModes: string[];
  humanReadableAccessModes: AccessMode[];
  volumeName: string;
  resourcesRequests?: {
    storage?: string;
  };
  storageClass: string;
  allowVolumeExpansion: boolean;
  volumeMode?: VolumeMode;
  phase: PersistentVolumeClaimPhase;
  labels?: Record<string, string>;
  owningApplications?: K8sVolOwningApplication[];
}

export interface StorageClass {
  name: string;
  provisioner: string;
  reclaimPolicy: ReclaimPolicy | null;
  allowVolumeExpansion: boolean | null;
  isDefault: boolean;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  creationDate: string;
  parameters?: Record<string, string>;
  mountOptions?: string[];
}
