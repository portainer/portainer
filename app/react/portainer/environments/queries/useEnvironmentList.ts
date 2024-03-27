import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';

import { EnvironmentStatus, EnvironmentType } from '../types';
import {
  EnvironmentsQueryParams,
  getEnvironments,
} from '../environment.service';

import { environmentQueryKeys } from './query-keys';

export const ENVIRONMENTS_POLLING_INTERVAL = 30000; // in ms

export const SortOptions = [
  'Name',
  'Group',
  'Status',
  'LastCheckIn',
  'EdgeID',
] as const;
export type SortType = (typeof SortOptions)[number];
export function isSortType(value?: string): value is SortType {
  return SortOptions.includes(value as SortType);
}

export function getSortType(value?: string): SortType | undefined {
  return isSortType(value) ? value : undefined;
}

export type Query = EnvironmentsQueryParams & {
  page?: number;
  pageLimit?: number;
  sort?: SortType;
  order?: 'asc' | 'desc';
};

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
  {
    enabled,
    refetchInterval,
    staleTime,
  }: {
    refetchInterval?:
      | number
      | false
      | ((data?: GetEndpointsResponse) => false | number);
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const { isLoading, data } = useQuery(
    [
      ...environmentQueryKeys.base(),
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

      // Workaround for EE-6060: filter out Nomad results when no filter is applied.
      // Remove when cleaning up API.
      if (!query.types || query.types.length === 0) {
        const environmentTypesArray: EnvironmentType[] = [
          EnvironmentType.Docker,
          EnvironmentType.AgentOnDocker,
          EnvironmentType.Azure,
          EnvironmentType.EdgeAgentOnDocker,
          EnvironmentType.KubernetesLocal,
          EnvironmentType.AgentOnKubernetes,
          EnvironmentType.EdgeAgentOnKubernetes,
        ];

        // eslint-disable-next-line no-param-reassign
        query.types = environmentTypesArray;
      }

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
    updateAvailable: data ? data.updateAvailable : false,
  };
}
