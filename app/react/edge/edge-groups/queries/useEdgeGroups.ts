import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeGroup } from '../types';

async function getEdgeGroups() {
  try {
    const { data } = await axios.get<EdgeGroup[]>('/edge_groups');
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed fetching edge groups');
  }
}

export function useEdgeGroups<T = EdgeGroup[]>({
  select,
}: {
  select?: (groups: EdgeGroup[]) => T;
} = {}) {
  return useQuery(['edge', 'groups'], getEdgeGroups, { select });
}
