import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeJob } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export interface EdgeJobResponse extends Omit<EdgeJob, 'Endpoints'> {
  Endpoints: Array<EnvironmentId> | null;
}

async function getEdgeJob(id: EdgeJobResponse['Id']) {
  try {
    const { data } = await axios.get<EdgeJobResponse>(buildUrl({ id }));
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job');
  }
}

export function useEdgeJob<T = EdgeJobResponse>(
  id: EdgeJobResponse['Id'],
  {
    select,
  }: {
    select?: (job: EdgeJobResponse) => T;
  } = {}
) {
  return useQuery(queryKeys.item(id), () => getEdgeJob(id), { select });
}
