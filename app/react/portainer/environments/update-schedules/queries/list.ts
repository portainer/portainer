import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeUpdateSchedule } from '../types';

import { queryKeys } from './query-keys';

async function getList() {
  try {
    const { data } = await axios.get<EdgeUpdateSchedule[]>(
      '/edge_update_schedules'
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}

export function useGetList() {
  return useQuery(queryKeys.list(), getList);
}
