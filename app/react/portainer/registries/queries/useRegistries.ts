import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Registry, RegistryTypes } from '../types/registry';
import { usePublicSettings } from '../../settings/queries';

export function useRegistries<T = Registry[]>({
  enabled,
  select,
  onSuccess,
}: {
  enabled?: boolean;
  select?: (registries: Registry[]) => T;
  onSuccess?: (data: T) => void;
} = {}) {
  const hideDefaultRegistryQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry.Hide,
    enabled,
  });

  const hideDefault = !!hideDefaultRegistryQuery.data;

  return useQuery(
    ['registries'],
    async () => {
      const registries = await getRegistries();

      if (
        hideDefault ||
        registries.find((r) => r.Type === RegistryTypes.DOCKERHUB)
      ) {
        return registries;
      }

      return [
        {
          Name: 'Docker Hub (anonymous)',
          Id: 0,
          Type: RegistryTypes.DOCKERHUB,
        } as Registry,
        ...registries,
      ];
    },
    {
      select,
      ...withError('Unable to retrieve registries'),
      enabled: hideDefaultRegistryQuery.isSuccess && enabled,
      onSuccess,
    }
  );
}

export async function getRegistries() {
  try {
    const { data } = await axios.get<Registry[]>('/registries');
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve registries');
  }
}
