import { useQuery } from '@tanstack/react-query';
import { Service } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { queryKeys } from '@/react/docker/services/queries/query-keys';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { buildUrl } from '@/react/docker/services/queries/build-url';

import { Filters } from '../types';
import { withFiltersQueryParam } from '../../proxy/queries/utils';

export function useServices<T = Service>(
  {
    environmentId,
    filters,
  }: { environmentId: EnvironmentId; filters?: Filters },
  {
    enabled,
    select,
  }: { enabled?: boolean; select?: (services: Array<Service>) => Array<T> } = {}
) {
  return useQuery(
    queryKeys.filters(environmentId, filters),
    () => getServices(environmentId, filters),
    {
      ...withError('Unable to retrieve services'),
      enabled,
      select,
    }
  );
}

export async function getServices(
  environmentId: EnvironmentId,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<Service[]>(buildUrl(environmentId), {
      params: withFiltersQueryParam(filters),
    });

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get services');
  }
}
