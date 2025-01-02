import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';

import { EnvironmentGroupId } from '../types';

import { EnvironmentGroup } from './types';
import { getGroup, getGroups } from './environment-groups.service';
import { queryKeys } from './queries/query-keys';

export function useGroups<T = EnvironmentGroup[]>({
  select,
  enabled = true,
}: { select?: (group: EnvironmentGroup[]) => T; enabled?: boolean } = {}) {
  return useQuery(queryKeys.base(), getGroups, {
    select,
    enabled,
  });
}

export function useGroup<T = EnvironmentGroup>(
  groupId?: EnvironmentGroupId,
  select?: (group: EnvironmentGroup | null) => T
) {
  return useQuery(
    queryKeys.group(groupId),
    () => {
      if (groupId === undefined) {
        return null;
      }
      return getGroup(groupId);
    },
    {
      staleTime: 50,
      select,
      enabled: groupId !== undefined,
      ...withGlobalError('Failed loading group'),
    }
  );
}
