import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Registry } from '../types/registry';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useRegistry(registryId?: Registry['Id']) {
  const environmentId = useEnvironmentId();

  return useQuery(
    registryId ? queryKeys.item(registryId) : [],
    () => (registryId ? getRegistry(registryId, environmentId) : undefined),
    {
      enabled: !!registryId,
    }
  );
}

async function getRegistry(registryId: Registry['Id'], environmentId: number) {
  try {
    const { data } = await axios.get<Registry>(buildUrl(registryId), {
      params: {
        endpointId: environmentId,
      },
    });
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registry');
  }
}
