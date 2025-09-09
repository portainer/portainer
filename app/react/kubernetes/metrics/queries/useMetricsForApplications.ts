import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { ApplicationResource } from '../types';

import { queryKeys } from './query-keys';

export function useMetricsForApplicationsQuery<T = ApplicationResource>(
  environmentId: EnvironmentId,
  nodeName?: string,
  queryOptions?: UseQueryOptions<ApplicationResource, unknown, T>
) {
  return useQuery({
    queryKey: queryKeys.applicationMetrics(environmentId, nodeName),
    queryFn: () => getTotalResourcesForAllApplications(environmentId, nodeName),
    ...queryOptions,
  });
}

export async function getTotalResourcesForAllApplications(
  environmentId: EnvironmentId,
  nodeName?: string
) {
  try {
    const { data: resources } = await axios.get<ApplicationResource>(
      `kubernetes/${environmentId}/metrics/applications_resources`,
      {
        params: {
          node: nodeName,
        },
      }
    );
    return resources;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to retrieve total resources for all applications'
    );
  }
}
