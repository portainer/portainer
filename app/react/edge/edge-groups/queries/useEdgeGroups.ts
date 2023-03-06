import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentType } from '@/react/portainer/environments/types';

import { EdgeGroup } from '../types';

interface EdgeGroupListItemResponse extends EdgeGroup {
  EndpointTypes: Array<EnvironmentType>;
}

async function getEdgeGroups() {
  try {
    const { data } = await axios.get<EdgeGroupListItemResponse[]>(
      '/edge_groups'
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed fetching edge groups');
  }
}

export function useEdgeGroups<T = EdgeGroupListItemResponse[]>({
  select,
}: {
  select?: (groups: EdgeGroupListItemResponse[]) => T;
} = {}) {
  return useQuery(['edge', 'groups'], getEdgeGroups, { select });
}
