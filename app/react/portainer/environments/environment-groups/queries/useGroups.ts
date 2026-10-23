import { useQuery } from '@tanstack/react-query';

import { endpointGroupList } from '@api/sdk.gen';

import { EnvironmentGroup } from '../types';

import { queryKeys } from './query-keys';

/** Get all environment groups. **Only portainer administrators can access this endpoint.** */
export function useGroups<T = EnvironmentGroup[]>({
  select,
  enabled = true,
  size = false,
}: {
  select?: (group: EnvironmentGroup[]) => T;
  enabled?: boolean;
  size?: boolean;
} = {}) {
  return useQuery(
    queryKeys.list(size),
    async () => {
      const { data } = await endpointGroupList({ query: { size } });
      return data;
    },
    {
      select,
      enabled,
    }
  );
}
