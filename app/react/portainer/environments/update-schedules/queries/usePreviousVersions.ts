import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  EdgeGroupId,
  EnvironmentId,
} from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

interface Options<T> {
  select?: (data: Record<EnvironmentId, string>) => T;
  onSuccess?(data: T): void;
  enabled?: boolean;
}

export function usePreviousVersions<T = Record<EdgeGroupId, string>>(
  edgeGroupIds: EdgeGroupId[],
  { select, enabled }: Options<T> = {}
) {
  return useQuery(
    queryKeys.previousVersions(edgeGroupIds),
    () => getPreviousVersions(edgeGroupIds),
    {
      select,
      enabled: enabled && edgeGroupIds.length > 0,
    }
  );
}

async function getPreviousVersions(edgeGroupIds: EdgeGroupId[]) {
  try {
    const { data } = await axios.get<Record<EdgeGroupId, string>>(
      buildUrl(undefined, 'previous_versions'),
      {
        params: { edgeGroupIds },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}
