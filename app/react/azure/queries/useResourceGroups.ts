import _ from 'lodash';
import { useQueries } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { azureErrorParser } from '../services/utils';
import { Subscription, ResourceGroup } from '../types';

import { queryKeys } from './query-keys';
import { buildResourceGroupUrl } from './utils';

export function useResourceGroups(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = []
) {
  const queries = useQueries(
    subscriptions.map((subscription) => ({
      queryKey: queryKeys.resourceGroups(
        environmentId,
        subscription.subscriptionId
      ),
      queryFn: async () => {
        const groups = await getResourceGroups(
          environmentId,
          subscription.subscriptionId
        );
        return [subscription.subscriptionId, groups] as const;
      },
      ...withError('Unable to retrieve Azure resource groups'),
    }))
  );

  return {
    resourceGroups: Object.fromEntries(
      _.compact(
        queries.map((q) => {
          if (q.data) {
            return q.data;
          }

          return null;
        })
      )
    ),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

async function getResourceGroups(
  environmentId: EnvironmentId,
  subscriptionId: string
) {
  try {
    const {
      data: { value },
    } = await axios.get<{ value: ResourceGroup[] }>(
      buildResourceGroupUrl(environmentId, subscriptionId),
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
