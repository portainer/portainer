import { useQuery } from 'react-query';

import {
  EnvironmentsQueryParams,
  getEndpoints,
} from '@/portainer/environments/environment.service';
import { EnvironmentStatus } from '@/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

const ENVIRONMENTS_POLLING_INTERVAL = 30000; // in ms

interface Query extends EnvironmentsQueryParams {
  page?: number;
  pageLimit?: number;
}

export function useEnvironmentList(query: Query = {}, refetchOffline = false) {
  const { page = 1, pageLimit = 100 } = query;

  const { isLoading, data } = useQuery(
    ['environments', { page, pageLimit, ...query }],
    async () => {
      const start = (page - 1) * pageLimit + 1;
      return getEndpoints(start, pageLimit, query);
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
      onError(error) {
        notifyError('Failed loading environments', error as Error);
      },
    }
  );

  return {
    isLoading,
    environments: data ? data.value : [],
    totalCount: data ? data.totalCount : 0,
    totalAvailable: data ? data.totalAvailable : 0,
  };
}
