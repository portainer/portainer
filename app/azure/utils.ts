import { ProviderViewModel } from '@/azure/models/provider';
import { ResourceGroup } from '@/azure/types';

export function getSubscriptionResourceGroups(
  subscriptionId?: string,
  resourceGroups?: Record<string, ResourceGroup[]>
) {
  if (!subscriptionId || !resourceGroups || !resourceGroups[subscriptionId]) {
    return [];
  }

  return resourceGroups[subscriptionId].map(({ name, id }) => ({
    value: id,
    label: name,
  }));
}

export function aggregateResourceGroups(
  resourceGroups?: Record<string, ResourceGroup[]>
) {
  if (!resourceGroups) {
    return [];
  }

  let aggregatedResources: unknown[] = [];
  Object.keys(resourceGroups).forEach((key) => {
    aggregatedResources = aggregatedResources.concat(resourceGroups[key]);
  });
  return aggregatedResources;
}

export function getSubscriptionLocations(
  subscriptionId?: string,
  containerInstanceProviders?: Record<string, ProviderViewModel | undefined>
) {
  if (!subscriptionId || !containerInstanceProviders) {
    return [];
  }

  const provider = containerInstanceProviders[subscriptionId];
  if (!provider) {
    return [];
  }

  return provider.locations.map((location) => ({
    value: location,
    label: location,
  }));
}
