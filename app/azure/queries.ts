import _ from 'lodash';
import { useQueries, useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';

import {
  getResourceGroup,
  getResourceGroups,
} from './services/resource-groups.service';
import {
  getSubscription,
  getSubscriptions,
} from './services/subscription.service';
import { Subscription } from './types';
import { getContainerInstanceProvider } from './services/provider.service';
import { getContainerGroup } from './services/container-groups.service';

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

export function useSubscription(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  return useQuery(
    ['azure', environmentId, 'subscriptions', subscriptionId],
    () => getSubscription(environmentId, subscriptionId),
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
  };
}

export function useResourceGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string
) {
  return useQuery(
    [
      'azure',
      environmentId,
      'subscriptions',
      subscriptionId,
      'resourceGroups',
      resourceGroupName,
    ],
    () => getResourceGroup(environmentId, subscriptionId, resourceGroupName),
    {
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to retrieve Azure resource group',
        },
      },
    }
  );
}

export function useProviders(
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
        'provider',
      ],
      queryFn: async () => {
        const provider = await getContainerInstanceProvider(
          environmentId,
          subscription.subscriptionId
        );
        return [subscription.subscriptionId, provider] as const;
      },
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to retrieve Azure providers',
        },
      },
    }))
  );

  return {
    providers: Object.fromEntries(
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
  };
}

export function useContainerGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string,
  containerGroupName: string
) {
  return useQuery(
    [
      'azure',
      environmentId,
      'subscriptions',
      subscriptionId,
      'resourceGroups',
      resourceGroupName,
      'containerGroups',
      containerGroupName,
    ],
    () =>
      getContainerGroup(
        environmentId,
        subscriptionId,
        resourceGroupName,
        containerGroupName
      )
  );
}
