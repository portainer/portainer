import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { Subscription } from '../types';
import { azureErrorParser } from '../services/utils';

import { queryKeys } from './query-keys';
import { buildSubscriptionsUrl } from './utils';

export function useSubscription(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  return useQuery(
    queryKeys.subscription(environmentId, subscriptionId),
    () => getSubscription(environmentId, subscriptionId),
    {
      ...withError('Unable to retrieve Azure subscription'),
    }
  );
}

async function getSubscription(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const { data } = await axios.get<Subscription>(
      buildSubscriptionsUrl(environmentId, subscriptionId),
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
