import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { azureErrorParser } from '../services/utils';
import { Subscription } from '../types';

import { queryKeys } from './query-keys';
import { buildSubscriptionsUrl } from './utils';

export function useSubscriptions(environmentId: EnvironmentId) {
  return useQuery(
    queryKeys.subscriptions(environmentId),
    () => getSubscriptions(environmentId),
    {
      ...withError('Unable to retrieve Azure subscriptions'),
    }
  );
}

async function getSubscriptions(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<{ value: Subscription[] }>(
      buildSubscriptionsUrl(environmentId),
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
