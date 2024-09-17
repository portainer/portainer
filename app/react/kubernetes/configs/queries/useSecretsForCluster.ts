import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { SecretQueryParams } from './types';
import { secretQueryKeys } from './query-keys';

export function useSecretsForCluster(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number } & SecretQueryParams
) {
  const { autoRefreshRate, ...params } = options ?? {};
  return useQuery(
    secretQueryKeys.secretsForCluster(environmentId, params),
    () =>
      getSecretsForCluster(environmentId, {
        ...params,
        isUsed: params?.isUsed,
      }),
    {
      ...withError('Unable to retrieve secrets for cluster'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getSecretsForCluster(
  environmentId: EnvironmentId,
  params?: { withData?: boolean; isUsed?: boolean }
) {
  const secrets = await getSecrets(environmentId, undefined, params);
  return secrets;
}

// get all secrets for a cluster
async function getSecrets(
  environmentId: EnvironmentId,
  withSystem?: boolean,
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
