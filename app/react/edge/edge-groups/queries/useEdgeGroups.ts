import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  EnvironmentId,
  EnvironmentType,
} from '@/react/portainer/environments/types';

import { EdgeGroup } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export interface EdgeGroupListItemResponse extends EdgeGroup {
  EndpointTypes: Array<EnvironmentType>;
  HasEdgeStack?: boolean;
  HasEdgeJob?: boolean;
  HasEdgeConfig?: boolean;
  TrustedEndpoints: Array<EnvironmentId>;
}

async function getEdgeGroups() {
  try {
    const { data } = await axios.get<EdgeGroupListItemResponse[]>(buildUrl());
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
  return useQuery(queryKeys.base(), getEdgeGroups, { select });
}
