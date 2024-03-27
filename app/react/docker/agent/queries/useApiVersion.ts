import { useQuery } from '@tanstack/react-query';

import axios, {
  isAxiosError,
  parseAxiosError,
} from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from '../../proxy/queries/build-url';

export function useApiVersion(environmentId: EnvironmentId) {
  return useQuery(['environment', environmentId, 'agent', 'ping'], () =>
    getApiVersion(environmentId)
  );
}

async function getApiVersion(environmentId: EnvironmentId) {
  try {
    const { headers } = await axios.get(buildUrl(environmentId, 'ping'));
    return parseInt(headers['portainer-agent-api-version'], 10) || 1;
  } catch (error) {
    // 404 - agent is up - set version to 1
    if (isAxiosError(error) && error.response?.status === 404) {
      return 1;
    }

    throw parseAxiosError(error as Error, 'Unable to ping agent');
  }
}
