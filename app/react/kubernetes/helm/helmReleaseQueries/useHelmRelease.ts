import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { HelmRelease } from '../types';

import { queryKeys } from './query-keys';

type Options<T> = {
  select?: (data: HelmRelease) => T;
  showResources?: boolean;
  refetchInterval?: number;
  enabled?: boolean;
  staleTime?: number;
  /** when the revision is undefined, the latest revision is fetched */
  revision?: number;
};
/**
 * React hook to fetch a specific Helm release
 */
export function useHelmRelease<T = HelmRelease>(
  environmentId: EnvironmentId,
  name: string,
  namespace: string,
  options: Options<T> = {}
) {
  const { select, showResources, refetchInterval, revision, staleTime } =
    options;
  return useQuery(
    queryKeys.release(environmentId, namespace, name, revision, showResources),
    () =>
      getHelmRelease(environmentId, name, {
        namespace,
        showResources,
        revision,
      }),
    {
      enabled: !!environmentId && !!name && !!namespace && options.enabled,
      ...withGlobalError('Unable to retrieve helm application details'),
      retry: 3,
      // occasionally the application shows before the release is created, take some more time to refetch
      retryDelay: 2000,
      select,
      refetchInterval,
      staleTime,
    }
  );
}

type Params = {
  namespace: string;
  showResources?: boolean;
  revision?: number;
};

/**
 * Get a specific Helm release
 */
async function getHelmRelease(
  environmentId: EnvironmentId,
  name: string,
  params: Params
) {
  try {
    const { data } = await axios.get<HelmRelease>(
      `endpoints/${environmentId}/kubernetes/helm/${name}`,
      {
        params,
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve helm application details');
  }
}
