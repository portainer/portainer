import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from '../types';

import { secretQueryKeys } from './query-keys';

export function useSecretsForCluster(
  environmentId: EnvironmentId,
  { withSystem = false }: { withSystem?: boolean } = {},
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    secretQueryKeys.secretsForCluster(environmentId, withSystem),
    () => getSecretsForCluster(environmentId, withSystem),
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
  withSystem: boolean
) {
  const secrets = await getSecrets(environmentId, undefined, withSystem);
  return secrets;
}

// get all secrets for a cluster
async function getSecrets(
  environmentId: EnvironmentId,
  namespace?: string,
  withSystem?: boolean
) {
  try {
    const { data } = await axios.get<Configuration[]>(
      `/kubernetes/${environmentId}/secrets`,
      {
        params: {
          withSystem,
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve secrets');
  }
}