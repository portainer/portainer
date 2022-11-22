import { useQuery } from 'react-query';
import { RetryValue } from 'react-query/types/core/retryer';

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

export function useSystemStatus<T = StatusResponse>({
  select,
  enabled,
  retry,
  onSuccess,
}: {
  select?: (status: StatusResponse) => T;
  enabled?: boolean;
  retry?: RetryValue<unknown>;
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKey, () => getSystemStatus(), {
    select,
    enabled,
    retry,
    onSuccess,
  });
}
