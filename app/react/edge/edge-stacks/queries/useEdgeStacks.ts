import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeStack } from '../types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useEdgeStacks<T = Array<EdgeStack>>({
  select,
  /**
   * If set to a number, the query will continuously refetch at this frequency in milliseconds.
   * If set to a function, the function will be executed with the latest data and query to compute a frequency
   * Defaults to `false`.
   */
  refetchInterval,
}: {
  select?: (stacks: EdgeStack[]) => T;
  refetchInterval?: number | false | ((data?: T) => false | number);
} = {}) {
  return useQuery(queryKeys.base(), () => getEdgeStacks(), {
    ...withError('Failed loading Edge stack'),
    select,
    refetchInterval,
  });
}

export async function getEdgeStacks() {
  try {
    const { data } = await axios.get<EdgeStack[]>(buildUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
