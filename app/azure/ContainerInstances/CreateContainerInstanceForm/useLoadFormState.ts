import { useQueries, useQuery } from 'react-query';
import { useEffect } from 'react';

import * as notifications from '@/portainer/services/notifications';
import PortainerError from '@/portainer/error';
import { EnvironmentId } from '@/portainer/environments/types';
import { Option } from '@/portainer/components/form-components/Input/Select';
import { getResourceGroups } from '@/azure/services/resource-groups.service';
import { getSubscriptions } from '@/azure/services/subscription.service';
import { getContainerInstanceProvider } from '@/azure/services/provider.service';
import { ContainerInstanceFormValues, Subscription } from '@/azure/types';
import { parseAccessControlFormData } from '@/portainer/access-control/utils';

import {
  getSubscriptionLocations,
  getSubscriptionResourceGroups,
} from './utils';

export function useLoadFormState(
  environmentId: EnvironmentId,
  isUserAdmin: boolean
) {
  const { subscriptions, isLoading: isLoadingSubscriptions } =
    useSubscriptions(environmentId);
  const { resourceGroups, isLoading: isLoadingResourceGroups } =
    useResourceGroups(environmentId, subscriptions);
  const { providers, isLoading: isLoadingProviders } = useProviders(
    environmentId,
    subscriptions
  );

  const subscriptionOptions =
    subscriptions?.map((s) => ({
      value: s.subscriptionId,
      label: s.displayName,
    })) || [];

  const initSubscriptionId = getFirstValue(subscriptionOptions);

  const subscriptionResourceGroups = getSubscriptionResourceGroups(
    initSubscriptionId,
    resourceGroups
  );

  const subscriptionLocations = getSubscriptionLocations(
    initSubscriptionId,
    providers
  );

  const initialValues: ContainerInstanceFormValues = {
    name: '',
    location: getFirstValue(subscriptionLocations),
    subscription: initSubscriptionId,
    resourceGroup: getFirstValue(subscriptionResourceGroups),
    image: '',
    os: 'Linux',
    memory: 1,
    cpu: 1,
    ports: [{ container: '80', host: '80', protocol: 'TCP' }],
    allocatePublicIP: true,
    accessControl: parseAccessControlFormData(isUserAdmin),
  };

  return {
    isUserAdmin,
    initialValues,
    subscriptions: subscriptionOptions,
    resourceGroups,
    providers,
    isLoading:
      isLoadingProviders || isLoadingResourceGroups || isLoadingSubscriptions,
  };

  function getFirstValue<T extends string | number>(arr: Option<T>[]) {
    if (arr.length === 0) {
      return undefined;
    }

    return arr[0].value;
  }
}

function useSubscriptions(environmentId: EnvironmentId) {
  const { data, isError, error, isLoading } = useQuery(
    'azure.subscriptions',
    () => getSubscriptions(environmentId)
  );

  useEffect(() => {
    if (isError) {
      notifications.error(
        'Failure',
        error as PortainerError,
        'Unable to retrieve Azure resources'
      );
    }
  }, [isError, error]);

  return { subscriptions: data || [], isLoading };
}

function useResourceGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[]
) {
  const queries = useQueries(
    subscriptions.map((subscription) => ({
      queryKey: ['azure.resourceGroups', subscription.subscriptionId],
      queryFn: () =>
        getResourceGroups(environmentId, subscription.subscriptionId),
    }))
  );

  useEffect(() => {
    const failedQuery = queries.find((q) => q.error);
    if (failedQuery) {
      notifications.error(
        'Failure',
        failedQuery.error as PortainerError,
        'Unable to retrieve Azure resources'
      );
    }
  }, [queries]);

  return {
    resourceGroups: Object.fromEntries(
      queries.map((q, index) => [
        subscriptions[index].subscriptionId,
        q.data || [],
      ])
    ),
    isLoading: queries.some((q) => q.isLoading),
  };
}

function useProviders(
  environmentId: EnvironmentId,
  subscriptions: Subscription[]
) {
  const queries = useQueries(
    subscriptions.map((subscription) => ({
      queryKey: [
        'azure.containerInstanceProvider',
        subscription.subscriptionId,
      ],
      queryFn: () =>
        getContainerInstanceProvider(
          environmentId,
          subscription.subscriptionId
        ),
    }))
  );

  useEffect(() => {
    const failedQuery = queries.find((q) => q.error);
    if (failedQuery) {
      notifications.error(
        'Failure',
        failedQuery.error as PortainerError,
        'Unable to retrieve Azure resources'
      );
    }
  }, [queries]);

  return {
    providers: Object.fromEntries(
      queries.map((q, index) => [subscriptions[index].subscriptionId, q.data])
    ),
    isLoading: queries.some((q) => q.isLoading),
  };
}
