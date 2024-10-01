import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { SecretQueryParams } from './types';
import { secretQueryKeys } from './query-keys';

export function useSecretsForCluster<TData = Configuration[]>(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    select?: (data: Configuration[]) => TData;
  } & SecretQueryParams
) {
  const { autoRefreshRate, select, ...params } = options ?? {};
  return useQuery(
    secretQueryKeys.secretsForCluster(environmentId, params),
    () =>
      getSecretsForCluster(environmentId, {
        ...params,
        isUsed: params?.isUsed,
      }),
    {
      ...withGlobalError('Unable to retrieve secrets for cluster'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      select,
    }
  );
}

async function getSecretsForCluster(
  environmentId: EnvironmentId,
  params?: { withData?: boolean; isUsed?: boolean }
) {
  const secrets = await getSecrets(environmentId, params);
  return secrets;
}

// get all secrets for a cluster
async function getSecrets(
  environmentId: EnvironmentId,
  params?: { withData?: boolean; isUsed?: boolean } | undefined
) {
  try {
    const { data } = await axios.get<Configuration[]>(
      `/kubernetes/${environmentId}/secrets`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve secrets');
  }
}
