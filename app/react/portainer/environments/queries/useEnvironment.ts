import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';

import { getDeploymentOptions, getEndpoint } from '../environment.service';
import { Environment, EnvironmentId } from '../types';

import { environmentQueryKeys } from './query-keys';

export function useEnvironment<T = Environment | null>(
  environmentId?: EnvironmentId,
  select?: (environment: Environment | null) => T,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    environmentId ? environmentQueryKeys.item(environmentId) : [],
    () => (environmentId ? getEndpoint(environmentId) : null),
    {
      select,
      ...withError('Failed loading environment'),
      staleTime: 50,
      enabled: !!environmentId,
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

export function useEnvironmentDeploymentOptions(id: EnvironmentId | undefined) {
  return useQuery(
    [...environmentQueryKeys.item(id!), 'deploymentOptions'],
    () => getDeploymentOptions(id!),
    {
      enabled: !!id,
      ...withError('Failed loading deployment options'),
    }
  );
}
