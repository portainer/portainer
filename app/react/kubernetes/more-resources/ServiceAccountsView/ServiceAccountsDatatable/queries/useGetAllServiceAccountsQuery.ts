import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { ServiceAccount } from '../../types';

import { queryKeys } from './query-keys';

export function useGetAllServiceAccountsQuery(
  environmentId: EnvironmentId,
  options?: {
    autoRefreshRate?: number;
    enabled?: boolean;
  }
) {
  return useQuery(
    queryKeys.list(environmentId),
    async () => getAllServiceAccounts(environmentId),
    {
      ...withError('Unable to get service accounts'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      enabled: options?.enabled,
    }
  );
}

async function getAllServiceAccounts(environmentId: EnvironmentId) {
  try {
    const { data: services } = await axios.get<ServiceAccount[]>(
      `kubernetes/${environmentId}/service_accounts`
    );

    return services;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get service accounts');
  }
}