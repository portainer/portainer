import { useQuery } from '@tanstack/react-query';
import { StorageClass, StorageClassList } from 'kubernetes-types/storage/v1';

import axios from '@/portainer/services/axios';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../../axiosError';

import { AccessMode, StorageClassFormValues } from './types';

export const availableStorageClassPolicies = [
  {
    Name: 'RWO',
    Description: 'Allow read-write from a single pod only (RWO)',
    selected: true,
  },
  {
    Name: 'RWX',
    Description:
      'Allow read-write access from one or more pods concurrently (RWX)',
    selected: false,
  },
];

export function useStorageClasses(environment?: Environment | null) {
  return useQuery(
    [
      'environments',
      environment?.Id,
      'kubernetes',
      'storageclasses',
      // include the storage classes in the cache key to force a refresh when the storage classes change in the environment object
      JSON.stringify(environment?.Kubernetes.Configuration.StorageClasses),
    ],
    async () => {
      if (!environment) {
        return [];
      }
      const storageClasses = await getStorageClasses(environment.Id);
      return storageClasses;
    },
    {
      ...withError('Failure', `Unable to get Storage Classes`),
      enabled: !!environment,
    }
  );
}

export function useStorageClassesFormValues(environment?: Environment | null) {
  return useQuery(
    [
      'environments',
      environment?.Id,
      'kubernetes',
      'storageclasses',
      // include the storage classes in the cache key to force a refresh when the storage classes change in the environment object
      JSON.stringify(environment?.Kubernetes.Configuration.StorageClasses),
    ],
    async () => {
      if (!environment) {
        return [];
      }
      const storageClasses = await getStorageClasses(environment.Id);
      const storageClassFormValues = transformStorageClassesToFormValues(
        storageClasses,
        environment
      );
      return storageClassFormValues;
    },
    {
      ...withError('Failure', `Unable to get Storage Classes`),
      enabled: !!environment,
    }
  );
}

async function getStorageClasses(
  environmentId: EnvironmentId
): Promise<StorageClass[]> {
  try {
    const { data: storageClassList } = await axios.get<StorageClassList>(
      `/endpoints/${environmentId}/kubernetes/apis/storage.k8s.io/v1/storageclasses`
    );
    return storageClassList.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve Storage Classes');
  }
}

function transformStorageClassesToFormValues(
  storageClasses: StorageClass[],
  environment: Environment
) {
  const storageClassFormValues: StorageClassFormValues[] = storageClasses.map(
    (storageClass) => {
      const enabledStorage =
        environment.Kubernetes.Configuration.StorageClasses?.find(
          (sc) => sc.Name === storageClass.metadata?.name
        );
      let selected = false;
      let AccessModes: AccessMode[] = [];
      if (enabledStorage) {
        selected = true;
        AccessModes =
          enabledStorage.AccessModes.flatMap(
            (name) =>
              availableStorageClassPolicies.find(
                (accessMode) => accessMode.Name === name
              ) || []
          ) || [];
      } else {
        // set a default access mode if the storage class is not enabled and there are available access modes
        AccessModes = [availableStorageClassPolicies[0]];
      }

      return {
        Name: storageClass.metadata?.name || '',
        Provisioner: storageClass.provisioner,
        AllowVolumeExpansion: !!storageClass.allowVolumeExpansion,
        selected,
        AccessModes,
      };
    }
  );
  return storageClassFormValues;
}
