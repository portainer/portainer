import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isAxiosError } from '@/portainer/services/axios/utils/isAxiosError';

import { buildAgentUrl } from './build-url';

export function useApiVersion(
  environmentId: EnvironmentId,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery(
    ['environment', environmentId, 'agent', 'api-version'],
    () => getApiVersion(environmentId),
    { enabled }
  );
}

async function getApiVersion(environmentId: EnvironmentId) {
  try {
    const { headers } = await axios.get(
      buildAgentUrl(environmentId, 1, 'ping')
    );
    return parseInt(headers['portainer-agent-api-version'], 10) || 1;
  } catch (error) {
    // 404 - agent is up - set version to 1
    if (isAxiosError(error) && error.response?.status === 404) {
      return 1;
    }

    throw parseAxiosError(error as Error, 'Unable to ping agent');
  }
}
