import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export function useSupportedAgentVersions<T = string[]>({
  select,
  onSuccess,
}: { select?: (data: string[]) => T; onSuccess?(data: T): void } = {}) {
  return useQuery(
    queryKeys.supportedAgentVersions(),
    getSupportedAgentVersions,
    {
      select,
      onSuccess,
      ...withError('failed fetching available agent versions'),
    }
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
