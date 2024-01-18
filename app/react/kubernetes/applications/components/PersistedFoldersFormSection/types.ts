import { StorageClass } from '@/react/portainer/environments/types';

export type PersistedFolderFormValue = {
  containerPath: string;
  storageClass: StorageClass;
  useNewVolume: boolean;
  persistentVolumeClaimName?: string; // empty for new volumes, set for existing volumes
  sizeUnit?: string;
  size?: string;
  existingVolume?: ExistingVolume;
  needsDeletion?: boolean;
};

export type ExistingVolume = {
  PersistentVolumeClaim: {
    Id: string;
    Name: string;
    Namespace: string;
    Storage: string;
    storageClass: StorageClass;
    CreationDate: string;
    ApplicationOwner?: string;
    ApplicationName?: string;
    PreviousName?: string;
    MountPath?: string;
    Yaml?: string;
  };
};
