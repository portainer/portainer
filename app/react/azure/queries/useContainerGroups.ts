import _ from 'lodash';
import { useMemo } from 'react';
import { useQueries } from 'react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Subscription, ContainerGroup } from '../types';

import { queryKeys } from './query-keys';
import { buildContainerGroupUrl } from './utils';

export function useContainerGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = [],
  enabled?: boolean
) {
  const queries = useQueries(
    useMemo(
      () =>
        subscriptions.map((subscription) => ({
          queryKey: queryKeys.containerGroups(
            environmentId,
            subscription.subscriptionId
          ),
          queryFn: async () =>
            getContainerGroups(environmentId, subscription.subscriptionId),
          ...withError('Unable to retrieve Azure container groups'),
          enabled,
        })),
      [subscriptions, enabled, environmentId]
    )
  );

  return useMemo(
    () => ({
      containerGroups: _.flatMap(_.compact(queries.map((q) => q.data))),
      isLoading: queries.some((q) => q.isLoading),
    }),
    [queries]
  );
}

export async function getContainerGroups(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const { data } = await axios.get<{ value: ContainerGroup[] }>(
      buildContainerGroupUrl(environmentId, subscriptionId),
      { params: { 'api-version': '2018-04-01' } }
    );

    return data.value;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve container groups');
  }
}
