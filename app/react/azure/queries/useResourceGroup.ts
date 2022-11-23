import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { azureErrorParser } from '../services/utils';
import { ResourceGroup } from '../types';

import { queryKeys } from './query-keys';
import { buildResourceGroupUrl } from './utils';

export function useResourceGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string
) {
  return useQuery(
    queryKeys.resourceGroup(environmentId, subscriptionId, resourceGroupName),
    () => getResourceGroup(environmentId, subscriptionId, resourceGroupName),
    {
      ...withError('Unable to retrieve Azure resource group'),
    }
  );
}

export async function getResourceGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string
) {
  try {
    const { data } = await axios.get<ResourceGroup>(
      buildResourceGroupUrl(environmentId, subscriptionId, resourceGroupName),
      { params: { 'api-version': '2018-02-01' } }
    );

    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Unable to retrieve resource group',
      azureErrorParser
    );
  }
}
