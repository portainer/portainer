import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Registry } from '../types/registry';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useRegistry(registryId?: Registry['Id']) {
  return useQuery(
    registryId ? queryKeys.item(registryId) : [],
    () => (registryId ? getRegistry(registryId) : undefined),
    {
      enabled: !!registryId,
    }
  );
}

async function getRegistry(registryId: Registry['Id']) {
  try {
    const { data } = await axios.get<Registry>(buildUrl(registryId));
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registry');
  }
}
