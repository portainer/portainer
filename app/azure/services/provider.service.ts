// import { ContainerInstanceProviderViewModel } from '../models/provider';

import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { parseViewModel } from '../models/provider';
import { ProviderResponse } from '../types';

import { azureErrorParser } from './utils';

export async function getContainerInstanceProvider(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const url = `/endpoints/${environmentId}/azure/subscriptions/${subscriptionId}/providers/Microsoft.ContainerInstance`;
    const { data } = await axios.get<ProviderResponse>(url, {
      params: { 'api-version': '2018-02-01' },
    });

    return parseViewModel(data);
  } catch (error) {
    throw parseAxiosError(
      error as Error,
      'Unable to retrieve provider',
      azureErrorParser
    );
  }
}
