import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from '../environment.service/utils';
import { EnvironmentId } from '../types';
import { Registry } from '../../registries/types/registry';
import {
  GenericRegistriesQueryOptions,
  useGenericRegistriesQuery,
} from '../../registries/queries/useRegistries';

import { environmentQueryKeys } from './query-keys';

export function useEnvironmentRegistries<T = Array<Registry>>(
  environmentId: EnvironmentId,
  queryOptions: GenericRegistriesQueryOptions<T> = {}
) {
  return useGenericRegistriesQuery(
    environmentQueryKeys.registries(environmentId),
    () => getEnvironmentRegistries(environmentId),
    queryOptions
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
