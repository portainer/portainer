import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { Volume } from '@/kubernetes/models/volume/Volume';

import { parseKubernetesAxiosError } from '../axiosError';

import { K8sVolumeInfo } from './types';
import { VolumeViewModel, StorageClassViewModel } from './ListView/types';

// useQuery to get a list of all volumes from an array of namespaces
export function useAllVolumesQuery(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
  }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'volumes'],
    () => getAllVolumes(environmentId, { withApplications: true }),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: convertToVolumeViewModels,
      ...withError('Unable to retrieve volumes'),
    }
  );
}

// useQuery to get a list of all volumes from an array of namespaces
export function useAllStoragesQuery(
  environmentId: EnvironmentId,
  queryOptions?: {
    refetchInterval?: number;
  }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'storages'],
    () => getAllVolumes(environmentId),
    {
      refetchInterval: queryOptions?.refetchInterval,
      select: convertToStorageClassViewModels,
      ...withError('Unable to retrieve volumes'),
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
  const storageClassMap = new Map<string, StorageClassViewModel>();

  volumes.forEach((volume) => {
    const storageClassName = volume.storageClass.name || 'none';

    const defaultStorageClass = {
      Name: storageClassName,
      Provisioner: volume.storageClass.provisioner,
      ReclaimPolicy: volume.storageClass.reclaimPolicy ?? '',
      AllowVolumeExpansion: volume.storageClass.allowVolumeExpansion || false,
      size: 0,
      Volumes: [],
    };

    const storageClassViewModel =
      storageClassMap.get(storageClassName) ?? defaultStorageClass;

    storageClassViewModel.size += volume.persistentVolumeClaim.storage || 0;
    storageClassViewModel.Volumes.push(
      ...volumesModels.filter(
        (v) => v.PersistentVolumeClaim.storageClass?.Name === storageClassName
      )
    );

    storageClassMap.set(storageClassName, storageClassViewModel);
  });

  storageClassMap.forEach((value, key) => {
    storageClassMap.set(key, {
      ...value,
      size: value.size,
    });
  });

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
