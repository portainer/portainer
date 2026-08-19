import _ from 'lodash';
import { useCallback } from 'react';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { EnvironmentType } from '@/react/portainer/environments/types';

export function useEdgeGroupHasType(groupIds: Array<EdgeGroup['Id']>) {
  const edgeGroupsQuery = useEdgeGroups();

  const edgeGroups = edgeGroupsQuery.data;

  const hasTypeFunction = createHasEnvironmentTypeFunction(
    groupIds,
    edgeGroups
  );
  const hasType = useCallback(
    (type: EnvironmentType) => hasTypeFunction(type),
    [hasTypeFunction]
  );

  return {
    hasType,
  };
}

/**
 * Returns true if any of the edge groups have the given type
 */
export function createHasEnvironmentTypeFunction(
  groupIds: EdgeGroup['Id'][],
  edgeGroups?: EdgeGroup[]
) {
  const modelEdgeGroups = _.compact(
    groupIds.map((id) => edgeGroups?.find((e) => e.Id === id))
  );
  const endpointTypes = modelEdgeGroups.flatMap((group) => group.EndpointTypes);

  function hasType(type: EnvironmentType) {
    return endpointTypes.includes(type);
  }

  return hasType;
}
