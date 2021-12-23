import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { EnvironmentGroup, EnvironmentGroupId } from './types';
import { getGroup } from './environment-groups.service';

export function useGroup<T = EnvironmentGroup>(
  groupId: EnvironmentGroupId,
  select?: (group: EnvironmentGroup) => T
) {
  const { data, isError, error } = useQuery(
    ['environment-groups', groupId],
    () => getGroup(groupId),
    {
      staleTime: 50,
      select,
    }
  );

  useEffect(() => {
    if (isError) {
      notifyError('Failed loading group', error as Error);
    }
  }, [isError, error]);

  return data;
}
