import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { getEndpoints } from '@/portainer/environments/environment.service';
import { EnvironmentStatus } from '@/portainer/environments/types';
import * as notifications from '@/portainer/services/notifications';

const ENVIRONMENTS_POLLING_INTERVAL = 30000; // in ms

export function useEnvironmentList(
  page: number,
  pageLimit: number,
  textFilter: string,
  refetchOffline = false
) {
  const { isLoading, data, isError, error } = useQuery(
    ['environments', page, pageLimit, textFilter],
    async () => {
      const start = (page - 1) * pageLimit + 1;
      return getEndpoints(start, pageLimit, { search: textFilter });
    },
    {
      keepPreviousData: true,
      refetchInterval: (data) => {
        if (!data || !refetchOffline) {
          return false;
        }

        const hasOfflineEnvironment = data.value.some(
          (env) => env.Status === EnvironmentStatus.Down
        );

        return hasOfflineEnvironment && ENVIRONMENTS_POLLING_INTERVAL;
      },
    }
  );

  useEffect(() => {
    if (isError) {
      notifications.error('Failed loading environments', error as Error, '');
    }
  }, [isError, error]);

  return {
    isLoading,
    environments: data ? data.value : [],
    totalCount: data ? data.totalCount : 0,
    totalAvailable: data ? data.totalAvailable : 0,
  };
}
