import {
  PersistentVolumeSpec,
  PersistentVolumeClaimSpec,
  PersistentVolumeClaimStatus,
  ObjectReference,
  CSIPersistentVolumeSource,
} from 'kubernetes-types/core/v1';

export interface K8sVolumeInfo {
  persistentVolume: K8sPersistentVolume;
  persistentVolumeClaim: K8sPersistentVolumeClaim;
  storageClass: K8sStorageClass;
}

interface K8sPersistentVolume {
  name?: string;
  annotations?: { [key: string]: string };
  accessModes?: PersistentVolumeSpec['accessModes'];
  capacity: PersistentVolumeSpec['capacity'];
  claimRef?: ObjectReference;
  storageClassName?: string;
  persistentVolumeReclaimPolicy: PersistentVolumeSpec['persistentVolumeReclaimPolicy'];
  volumeMode?: PersistentVolumeSpec['volumeMode'];
  csi?: CSIPersistentVolumeSource;
}

interface K8sPersistentVolumeClaim {
  id: string;
  name: string;
  namespace: string;
  storage: number;
  creationDate: Date;
  accessModes?: PersistentVolumeClaimSpec['accessModes'];
  volumeName: string;
  resourcesRequests?: PersistentVolumeClaimSpec['resources'];
  storageClass?: string;
  volumeMode?: PersistentVolumeClaimSpec['volumeMode'];
  owningApplications?: K8sApplication[];
  phase: PersistentVolumeClaimStatus['phase'];
}

interface K8sStorageClass {
  name: string;
  provisioner: string;
  reclaimPolicy?: PersistentVolumeSpec['persistentVolumeReclaimPolicy'];
  allowVolumeExpansion?: boolean;
}

interface K8sApplication {
  uid?: string;
  name: string;
  namespace?: string;
  kind?: string;
  labels?: { [key: string]: string };
}

export type Volumes = Record<string, K8sVolumeInfo>;
