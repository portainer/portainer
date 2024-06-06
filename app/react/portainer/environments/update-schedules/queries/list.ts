import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeUpdateResponse, StatusType } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export type EdgeUpdateListItemResponse = EdgeUpdateResponse & {
  status: StatusType;
  statusMessage: string;
};

async function getList(includeEdgeStacks?: boolean) {
  try {
    const { data } = await axios.get<EdgeUpdateListItemResponse[]>(buildUrl(), {
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
