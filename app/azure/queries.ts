import _ from 'lodash';
import { useQueries, useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';

import { getResourceGroups } from './services/resource-groups.service';
import { getSubscriptions } from './services/subscription.service';
import { Subscription } from './types';

export function useSubscriptions(environmentId: EnvironmentId) {
  return useQuery(
    'azure.subscriptions',
    () => getSubscriptions(environmentId),
    {
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to retrieve Azure subscriptions',
        },
      },
    }
  );
}

export function useResourceGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = []
) {
  const queries = useQueries(
    subscriptions.map((subscription) => ({
      queryKey: [
        'azure',
        environmentId,
        'subscriptions',
        subscription.subscriptionId,
        'resourceGroups',
      ],
      queryFn: async () => {
        const groups = await getResourceGroups(
          environmentId,
          subscription.subscriptionId
        );
        return [subscription.subscriptionId, groups] as const;
      },
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to retrieve Azure resource groups',
        },
      },
    }))
  );

  return {
    resourceGroups: Object.fromEntries(
      _.compact(
        queries.map((q) => {
          if (q.data) {
            return q.data;
          }

          return null;
        })
      )
    ),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    error: queries.find((q) => q.error)?.error || null,
  };
}
