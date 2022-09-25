import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeUpdateSchedule } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

async function getList(includeEdgeStacks?: boolean) {
  try {
    const { data } = await axios.get<EdgeUpdateSchedule[]>(buildUrl(), {
      params: { includeEdgeStacks },
    });
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}

export function useList(includeEdgeStacks?: boolean) {
  return useQuery(queryKeys.list(includeEdgeStacks), () =>
    getList(includeEdgeStacks)
  );
}
