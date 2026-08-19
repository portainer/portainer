import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

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
  const { namespace } = queryOptions;
  return useGenericRegistriesQuery(
    environmentQueryKeys.registries(environmentId, namespace),
    () => getEnvironmentRegistries(environmentId, { namespace }),
    queryOptions
  );
}

type Params = {
  namespace?: string;
};

async function getEnvironmentRegistries(
  environmentId: EnvironmentId,
  params: Params
) {
  try {
    const { data } = await axios.get<Array<Registry>>(
      buildUrl(environmentId, 'registries'),
      {
        params,
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registries');
  }
}
