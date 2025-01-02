import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { isBE } from '../feature-flags/feature-flags.service';

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

    data.Edition = isBE ? 'Business Edition' : 'Community Edition';

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
  retry?: UseQueryOptions['retry'];
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKey, () => getSystemStatus(), {
    select,
    enabled,
    retry,
    retryDelay: 1000,
    onSuccess,
  });
}
