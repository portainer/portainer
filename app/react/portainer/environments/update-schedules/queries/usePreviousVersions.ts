import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

interface Options<T> {
  select?: (data: Record<EnvironmentId, string>) => T;
  onSuccess?(data: T): void;
  enabled?: boolean;
}

export function usePreviousVersions<T = Record<EnvironmentId, string>>({
  select,
  onSuccess,
  enabled,
}: Options<T> = {}) {
  return useQuery(queryKeys.previousVersions(), getPreviousVersions, {
    select,
    onSuccess,
    enabled,
  });
}

async function getPreviousVersions() {
  try {
    const { data } = await axios.get<Record<EnvironmentId, string>>(
      buildUrl(undefined, 'previous_versions')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}
