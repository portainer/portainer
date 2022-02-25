import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ResourceGroup } from '../types';

import { azureErrorParser } from './utils';

export async function getResourceGroups(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const {
      data: { value },
    } = await axios.get<{ value: ResourceGroup[] }>(
      buildUrl(environmentId, subscriptionId),
      { params: { 'api-version': '2018-02-01' } }
    );

    return value;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Unable to retrieve resource groups',
      azureErrorParser
    );
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName?: string
) {
  let url = `/endpoints/${environmentId}/azure/subscriptions/${subscriptionId}/resourcegroups`;

  if (resourceGroupName) {
    url += `/${resourceGroupName}`;
  }

  return url;
}
