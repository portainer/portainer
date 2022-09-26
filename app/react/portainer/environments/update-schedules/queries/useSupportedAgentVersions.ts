import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export function useSupportedAgentVersions<T = string[]>({
  select,
}: { select?: (data: string[]) => T } = {}) {
  return useQuery(
    queryKeys.supportedAgentVersions(),
    getSupportedAgentVersions,
    { select }
  );
}

async function getSupportedAgentVersions() {
  try {
    const { data } = await axios.get<string[]>(
      buildUrl(undefined, 'agent_versions')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}
