import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { Volume } from '@/kubernetes/models/volume/Volume';

import { parseKubernetesAxiosError } from '../axiosError';

import { K8sVolumeInfo } from './types';
import { VolumeViewModel, StorageClassViewModel } from './ListView/types';

// useQuery to get a list of all volumes from an array of namespaces
export function useAllVolumesQuery(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'volumes'],
    () => getAllVolumes(environmentId, false, true),
    {
      ...withError('Unable to retrieve volumes'),
    }
  );
}

// useQuery to get a list of all volumes from an array of namespaces
export function useAllStoragesQuery(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'storages'],
    () => getAllVolumes(environmentId, true, false),
    {
      ...withError('Unable to retrieve volumes'),
    }
  );
}

// get all volumes from a namespace
export async function getAllVolumes(
  environmentId: EnvironmentId,
  isStorage: boolean,
  withApplications: boolean
) {
  try {
    const params = withApplications ? { withApplications } : {};
    const { data } = await axios.get<K8sVolumeInfo[]>(
      `/kubernetes/${environmentId}/volumes`,
      { params }
    );

    if (isStorage) {
      return convertToStorageClassViewModels(data);
    }

    return convertToVolumeViewModels(data);
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve volumes');
  }
}

function convertToVolumeViewModels(
  volumes: K8sVolumeInfo[]
): VolumeViewModel[] {
  return volumes.map((volume) => ({
    Applications: volume.persistentVolumeClaim.owningApplications?.map(
      (app) => ({
        Name: app.Name,
        Namespace: app.Namespace,
        Kind: app.Kind,
      })
    ) as VolumeViewModel['Applications'],
    PersistentVolumeClaim: {
      Name: volume.persistentVolumeClaim.name,
      storageClass: {
        Name: volume.persistentVolumeClaim.storageClass || '',
      },
      Storage: `${(volume.persistentVolumeClaim.storage / 1073741824).toFixed(
        0
      )}GiB`, // Convert KB to GB
      CreationDate: volume.persistentVolumeClaim.creationDate,
      ApplicationOwner:
        volume.persistentVolumeClaim.owningApplications?.[0]?.Name,
    },
    ResourcePool: {
      Namespace: {
        Name: volume.persistentVolumeClaim.namespace,
      },
    },
  }));
}

function convertToStorageClassViewModels(
  volumes: K8sVolumeInfo[]
): StorageClassViewModel[] {
  const volumesModels = convertToVolumeModel(volumes);
  const storageClassMap = new Map<string, StorageClassViewModel>();

  volumes.forEach((volume) => {
    const storageClassName = volume.storageClass.name || 'none';
    const storageClassViewModel = storageClassMap.get(storageClassName) || {
      Name: storageClassName,
      Provisioner: volume.storageClass.provisioner || '',
      ReclaimPolicy: volume.storageClass.reclaimPolicy || '',
      AllowVolumeExpansion: volume.storageClass.allowVolumeExpansion || false,
      size: 0,
      Volumes: [],
    };

    storageClassViewModel.size += volume.persistentVolumeClaim.storage || 0;
    storageClassViewModel.Volumes.push(
      ...volumesModels.filter(
        (v) => v.PersistentVolumeClaim.storageClass?.Name === storageClassName
      )
    );

    storageClassMap.set(storageClassName, storageClassViewModel);
  });

  // Convert size from KB to GB without reassigning the parameter
  storageClassMap.forEach((value, key) => {
    storageClassMap.set(key, {
      ...value,
      size: value.size / 1073741824,
    });
  });

  return Array.from(storageClassMap.values());
}

function convertToVolumeModel(volumes: K8sVolumeInfo[]): Volume[] {
  return volumes.map((volume) => ({
    ResourcePool: {} as Volume['ResourcePool'],
    PersistentVolumeClaim: {
      Id: volume.persistentVolumeClaim.id,
      Name: volume.persistentVolumeClaim.name,
      PreviousName: '',
      Namespace: volume.persistentVolumeClaim.namespace,
      storageClass: {
        Name: volume.persistentVolumeClaim.storageClass || '',
      },
      Storage: volume.persistentVolumeClaim.storage,
      CreationDate: volume.persistentVolumeClaim.creationDate,
      ApplicationOwner:
        volume.persistentVolumeClaim.owningApplications?.[0]?.Name,
      AccessModes: volume.persistentVolumeClaim.accessModes,
      ApplicationName: '',
    } as unknown as Volume['PersistentVolumeClaim'],
    Applications: [] as Volume['Applications'],
  }));
}
