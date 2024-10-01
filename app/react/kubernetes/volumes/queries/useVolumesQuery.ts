import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { withGlobalError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { Volume } from '@/kubernetes/models/volume/Volume';

import { parseKubernetesAxiosError } from '../../axiosError';
import { K8sVolumeInfo } from '../types';
import { VolumeViewModel, StorageClassViewModel } from '../ListView/types';

import { queryKeys } from './query-keys';

// useQuery to get a list of all volumes in a cluster
export function useAllVolumesQuery(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
  }
) {
  return useQuery(
    queryKeys.volumes(environmentId),
    () => getAllVolumes(environmentId, { withApplications: true }),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: convertToVolumeViewModels,
      ...withGlobalError('Unable to retrieve volumes'),
    }
  );
}

// useQuery to get a list of all volumes in a cluster
export function useAllStoragesQuery(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
  }
) {
  return useQuery(
    queryKeys.storages(environmentId),
    () => getAllVolumes(environmentId),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: convertToStorageClassViewModels,
      ...withGlobalError('Unable to retrieve volumes'),
    }
  );
}

// get all volumes from a namespace
export async function getAllVolumes(
  environmentId: EnvironmentId,
  params?: { withApplications: boolean }
) {
  try {
    const { data } = await axios.get<K8sVolumeInfo[]>(
      `/kubernetes/${environmentId}/volumes`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve volumes');
  }
}

function convertToVolumeViewModels(
  volumes: K8sVolumeInfo[]
): VolumeViewModel[] {
  return volumes.map((volume) => {
    const owningApplications =
      volume.persistentVolumeClaim.owningApplications ?? [];
    return {
      Applications: owningApplications.map((app) => ({
        Name: app.Name,
        Namespace: app.Namespace,
        Kind: app.Kind,
      })),
      PersistentVolumeClaim: {
        Namespace: volume.persistentVolumeClaim.namespace,
        Name: volume.persistentVolumeClaim.name,
        storageClass: {
          Name: volume.persistentVolumeClaim.storageClass || '',
        },
        Storage: humanize(volume.persistentVolumeClaim.storage),
        CreationDate: volume.persistentVolumeClaim.creationDate,
        ApplicationOwner:
          volume.persistentVolumeClaim.owningApplications?.[0]?.Name,
      },
      ResourcePool: {
        Namespace: {
          Name: volume.persistentVolumeClaim.namespace,
        },
      },
    };
  });
}

function convertToStorageClassViewModels(
  volumes: K8sVolumeInfo[]
): StorageClassViewModel[] {
  const volumesModels = convertToVolumeModel(volumes);

  // Use reduce to create a new Map
  const storageClassMap = volumesModels.reduce((acc, volume) => {
    const pvcStorageClass = volume.PersistentVolumeClaim.storageClass;
    const storageClassName = pvcStorageClass?.Name || 'none';
    const defaultStorageClass: StorageClassViewModel = {
      Name: pvcStorageClass?.Name || 'none',
      Provisioner: pvcStorageClass?.Provisioner ?? '',
      ReclaimPolicy: pvcStorageClass?.ReclaimPolicy ?? '',
      AllowVolumeExpansion: pvcStorageClass?.AllowVolumeExpansion || false,
      size: 0,
      Volumes: [],
    };

    const existingStorageClass =
      acc.get(storageClassName) ?? defaultStorageClass;

    // Create a new StorageClassViewModel with updated values
    const updatedStorageClass = {
      ...existingStorageClass,
      size:
        existingStorageClass.size + (volume.PersistentVolumeClaim.Storage || 0),
      Volumes: [...existingStorageClass.Volumes, volume],
    };

    // Return a new Map with the updated StorageClassViewModel
    return new Map(acc).set(storageClassName, updatedStorageClass);
  }, new Map<string, StorageClassViewModel>());

  // Convert the Map values to an array
  return Array.from(storageClassMap.values());
}

function convertToVolumeModel(volumes: K8sVolumeInfo[]): Volume[] {
  return volumes.map((volume) => ({
    PersistentVolumeClaim: {
      Id: volume.persistentVolumeClaim.id,
      Name: volume.persistentVolumeClaim.name,
      PreviousName: '',
      Namespace: volume.persistentVolumeClaim.namespace,
      storageClass: {
        Name: volume.persistentVolumeClaim.storageClass || '',
        Provisioner: volume.storageClass.provisioner,
        ReclaimPolicy: volume.storageClass.reclaimPolicy ?? '',
        AllowVolumeExpansion: volume.storageClass.allowVolumeExpansion || false,
      },
      Storage: volume.persistentVolumeClaim.storage,
      CreationDate: volume.persistentVolumeClaim.creationDate,
      ApplicationOwner:
        volume.persistentVolumeClaim.owningApplications?.[0]?.Name ?? '',
      AccessModes: volume.persistentVolumeClaim.accessModes ?? [],
      ApplicationName: '',
      MountPath: '',
      Yaml: '',
    },
    Applications: [],
  }));
}
