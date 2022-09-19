import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeUpdateSchedule } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export function useItem(id: EdgeUpdateSchedule['id']) {
  return useQuery(queryKeys.item(id), () => getItem(id));
}

async function getItem(id: EdgeUpdateSchedule['id']) {
  try {
    const { data } = await axios.get<EdgeUpdateSchedule>(buildUrl(id), {
      params: { includeEdgeStack: true },
    });
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}
