import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeJob } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

async function getEdgeJobs() {
  try {
    const { data } = await axios.get<EdgeJob[]>(buildUrl());
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed fetching edge jobs');
  }
}

export function useEdgeJobs<T = EdgeJob[]>({
  select,
}: {
  select?: (jobs: EdgeJob[]) => T;
} = {}) {
  return useQuery(queryKeys.base(), getEdgeJobs, { select });
}
