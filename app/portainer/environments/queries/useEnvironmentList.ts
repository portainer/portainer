import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';

import { EnvironmentStatus } from '../types';
import { EnvironmentsQueryParams, getEndpoints } from '../environment.service';

export const ENVIRONMENTS_POLLING_INTERVAL = 30000; // in ms

interface Query extends EnvironmentsQueryParams {
  page?: number;
  pageLimit?: number;
}

type GetEndpointsResponse = Awaited<ReturnType<typeof getEndpoints>>;

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
  { page = 1, pageLimit = 100, ...query }: Query = {},
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
        ...query,
      },
    ],
    async () => {
      const start = (page - 1) * pageLimit + 1;
      return getEndpoints(start, pageLimit, query);
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
