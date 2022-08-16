import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';

import { EnvironmentStatus } from '../types';
import {
  EnvironmentsQueryParams,
  getEnvironments,
} from '../environment.service';

export const ENVIRONMENTS_POLLING_INTERVAL = 30000; // in ms

export interface Query extends EnvironmentsQueryParams {
  page?: number;
  pageLimit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

type GetEndpointsResponse = Awaited<ReturnType<typeof getEnvironments>>;

export function refetchIfAnyOffline(data?: GetEndpointsResponse) {
  if (!data) {
    return false;
  }

  const hasOfflineEnvironment = data.value.some(
    (env) => env.Status === EnvironmentStatus.Down
  );

  if (!hasOfflineEnvironment) {
    return false;
  }

  return ENVIRONMENTS_POLLING_INTERVAL;
}

export function useEnvironmentList(
  { page = 1, pageLimit = 100, sort, order, ...query }: Query = {},
  refetchInterval?:
    | number
    | false
    | ((data?: GetEndpointsResponse) => false | number),
  staleTime = 0,
  enabled = true
) {
  const { isLoading, data } = useQuery(
    [
      'environments',
      {
        page,
        pageLimit,
        sort,
        order,
        ...query,
      },
    ],
    async () => {
      const start = (page - 1) * pageLimit + 1;
      return getEnvironments({
        start,
        limit: pageLimit,
        sort: { by: sort, order },
        query,
      });
    },
    {
      staleTime,
      keepPreviousData: true,
      refetchInterval,
      enabled,
      ...withError('Failure retrieving environments'),
    }
  );

  return {
    isLoading,
    environments: data ? data.value : [],
    totalCount: data ? data.totalCount : 0,
    totalAvailable: data ? data.totalAvailable : 0,
  };
}
