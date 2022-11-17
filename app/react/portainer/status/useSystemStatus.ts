import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export const queryKey = [...queryKeys.base(), 'status'] as const;

export interface StatusResponse {
  Edition: string;
  Version: string;
  InstanceID: string;
}

export async function getSystemStatus() {
  try {
    const { data } = await axios.get<StatusResponse>(buildUrl('status'));

    data.Edition = 'Community Edition';

    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useSystemStatus<T = StatusResponse>(
  select?: (status: StatusResponse) => T
) {
  return useQuery(queryKey, () => getSystemStatus(), { select });
}
