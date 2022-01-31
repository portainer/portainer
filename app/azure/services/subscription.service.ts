import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Subscription } from '../types';

import { azureErrorParser } from './utils';

export async function getSubscriptions(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<{ value: Subscription[] }>(
      buildUrl(environmentId),
      { params: { 'api-version': '2016-06-01' } }
    );
    return data.value;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve subscriptions',
      azureErrorParser
    );
  }
}

export async function getSubscription(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const { data } = await axios.get<Subscription>(
      buildUrl(environmentId, subscriptionId),
      { params: { 'api-version': '2016-06-01' } }
    );

    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve subscription',
      azureErrorParser
    );
  }
}

function buildUrl(environmentId: EnvironmentId, id?: string) {
  let url = `/endpoints/${environmentId}/azure/subscriptions`;
  if (id) {
    url += `/${id}`;
  }

  return url;
}
