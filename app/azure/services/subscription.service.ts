import { EnvironmentId } from '@/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Subscription } from '../types';

import { azureErrorParser } from './utils';

export async function getSubscriptions(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<{ value: Subscription[] }>(
      buildUrl(environmentId)
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

function buildUrl(environmentId: EnvironmentId, id?: string) {
  let url = `/endpoints/${environmentId}/azure/subscriptions?api-version=2016-06-01`;
  if (id) {
    url += `/${id}`;
  }

  return url;
}
