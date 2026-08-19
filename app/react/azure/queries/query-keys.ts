import { EnvironmentId } from '@/react/portainer/environments/types';

export const queryKeys = {
  subscriptions: (environmentId: EnvironmentId) =>
    ['azure', environmentId, 'subscriptions'] as const,
  subscription: (environmentId: EnvironmentId, subscriptionId: string) =>
    [...queryKeys.subscriptions(environmentId), subscriptionId] as const,
  resourceGroups: (environmentId: EnvironmentId, subscriptionId: string) =>
    [
      ...queryKeys.subscription(environmentId, subscriptionId),
      'resourceGroups',
    ] as const,
  resourceGroup: (
    environmentId: EnvironmentId,
    subscriptionId: string,
    resourceGroupName: string
  ) =>
    [
      ...queryKeys.resourceGroups(environmentId, subscriptionId),
      resourceGroupName,
    ] as const,
  provider: (environmentId: EnvironmentId, subscriptionId: string) =>
    [
      ...queryKeys.subscription(environmentId, subscriptionId),
      'provider',
    ] as const,
  containerGroups: (environmentId: EnvironmentId, subscriptionId: string) =>
    [
      ...queryKeys.subscription(environmentId, subscriptionId),
      'containerGroups',
    ] as const,
  containerGroup: (
    environmentId: EnvironmentId,
    subscriptionId: string,
    resourceGroupName: string,
    containerGroupName: string
  ) =>
    [
      ...queryKeys.resourceGroup(
        environmentId,
        subscriptionId,
        resourceGroupName
      ),
      'containerGroups',
      containerGroupName,
    ] as const,
};
