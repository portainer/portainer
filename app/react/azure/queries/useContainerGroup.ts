import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ContainerGroup } from '../types';

import { queryKeys } from './query-keys';
import { buildContainerGroupUrl } from './utils';

export function useContainerGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string,
  containerGroupName: string
) {
  return useQuery(
    queryKeys.containerGroup(
      environmentId,
      subscriptionId,
      resourceGroupName,
      containerGroupName
    ),
    () =>
      getContainerGroup(
        environmentId,
        subscriptionId,
        resourceGroupName,
        containerGroupName
      ),
    {
      ...withError('Unable to retrieve Azure container group'),
    }
  );
}

async function getContainerGroup(
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string,
  containerGroupName: string
) {
  try {
    const { data } = await axios.get<ContainerGroup>(
      buildContainerGroupUrl(
        environmentId,
        subscriptionId,
        resourceGroupName,
        containerGroupName
      ),
      { params: { 'api-version': '2018-04-01' } }
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
