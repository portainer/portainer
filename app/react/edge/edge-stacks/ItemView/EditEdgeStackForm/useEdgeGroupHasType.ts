import _ from 'lodash';
import { useCallback } from 'react';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { EnvironmentType } from '@/react/portainer/environments/types';

export function useValidateEnvironmentTypes(groupIds: Array<EdgeGroup['Id']>) {
  const edgeGroupsQuery = useEdgeGroups();

  const edgeGroups = edgeGroupsQuery.data || [];

  const modelEdgeGroups = _.compact(
    groupIds.map((id) => edgeGroups.find((e) => e.Id === id))
  );
  const endpointTypes = modelEdgeGroups.flatMap((group) => group.EndpointTypes);

  const hasType = useCallback(
    (type: EnvironmentType) => endpointTypes.includes(type),
    [endpointTypes]
  );

  return {
    hasType,
  };
}
