import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildSubscriptionsUrl(
  environmentId: EnvironmentId,
  id?: string
) {
  let url = `/endpoints/${environmentId}/azure/subscriptions`;
  if (id) {
    url += `/${id}`;
  }

  return url;
}

export function buildResourceGroupUrl(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName?: string
) {
  let url = `${buildSubscriptionsUrl(
    environmentId,
    subscriptionId
  )}/resourcegroups`;

  if (resourceGroupName) {
    url += `/${resourceGroupName}`;
  }

  return url;
}

export function buildContainerGroupUrl(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName?: string,
  containerGroupName?: string
) {
  let url = buildSubscriptionsUrl(environmentId, subscriptionId);

  if (resourceGroupName) {
    url += `/resourceGroups/${resourceGroupName}`;
  }

  url += `/providers/Microsoft.ContainerInstance/containerGroups`;

  if (containerGroupName) {
    url += `/${containerGroupName}`;
  }

  return url;
}
