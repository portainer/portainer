import _ from 'lodash';
import { useQueries } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { ProviderViewModel, Subscription } from '../types';
import { azureErrorParser } from '../services/utils';

import { queryKeys } from './query-keys';

export function useProvider(
  environmentId: EnvironmentId,
  subscriptions: Subscription[] = []
) {
  const queries = useQueries(
    subscriptions.map((subscription) => ({
      queryKey: queryKeys.provider(environmentId, subscription.subscriptionId),
      queryFn: async () => {
        const provider = await getContainerInstanceProvider(
          environmentId,
          subscription.subscriptionId
        );
        return [subscription.subscriptionId, provider] as const;
      },
      ...withError('Unable to retrieve Azure providers'),
    }))
  );

  return {
    providers: Object.fromEntries(
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
  };
}

interface ResourceType {
  resourceType: 'containerGroups' | string;
  locations: string[];
}

interface ProviderResponse {
  id: string;
  namespace: string;
  resourceTypes: ResourceType[];
}

async function getContainerInstanceProvider(
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
function parseViewModel({
  id,
  namespace,
  resourceTypes,
}: ProviderResponse): ProviderViewModel {
  const containerGroupType = _.find(resourceTypes, {
    resourceType: 'containerGroups',
  });
  const { locations = [] } = containerGroupType || {};
  return { id, namespace, locations };
}
