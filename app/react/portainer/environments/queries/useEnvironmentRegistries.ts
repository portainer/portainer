import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from '../environment.service/utils';
import { EnvironmentId } from '../types';
import { Registry, RegistryTypes } from '../../registries/types/registry';
import { usePublicSettings } from '../../settings/queries';

import { queryKeys } from './query-keys';

export function useEnvironmentRegistries<T = Array<Registry>>(
  environmentId: EnvironmentId,
  {
    select,
    enabled,
  }: { select?(data: Array<Registry>): T; enabled?: boolean } = {}
) {
  const hideDefaultRegistryQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry.Hide,
    enabled,
  });

  const hideDefault = !!hideDefaultRegistryQuery.data;

  return useQuery(
    queryKeys.registries(environmentId),
    async () => {
      const registries = await getEnvironmentRegistries(environmentId);

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
    { select, enabled: hideDefaultRegistryQuery.isSuccess && enabled }
  );
}

async function getEnvironmentRegistries(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Registry>>(
      buildUrl(environmentId, 'registries')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registries');
  }
}
