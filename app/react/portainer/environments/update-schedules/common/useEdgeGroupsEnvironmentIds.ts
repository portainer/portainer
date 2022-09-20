import _ from 'lodash';
import { useMemo } from 'react';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

export function useEdgeGroupsEnvironmentIds(
  edgeGroupsIds: Array<EdgeGroup['Id']>
) {
  const groupsQuery = useEdgeGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((g) => [g.Id, g.Endpoints])),
  });

  const envIds = useMemo(
    () =>
      _.uniq(
        _.compact(
          edgeGroupsIds.flatMap((id) =>
            groupsQuery.data ? groupsQuery.data[id] : []
          )
        )
      ),
    [edgeGroupsIds, groupsQuery.data]
  );

  return useMemo(
    () => ({
      data: groupsQuery.data ? envIds : null,
      isLoading: groupsQuery.isLoading,
    }),
    [envIds, groupsQuery.data, groupsQuery.isLoading]
  );
}
