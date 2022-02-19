import _ from 'lodash';

import { ProviderResponse } from '../types';

export interface ProviderViewModel {
  id: string;
  namespace: string;
  locations: string[];
}

export function parseViewModel({
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
