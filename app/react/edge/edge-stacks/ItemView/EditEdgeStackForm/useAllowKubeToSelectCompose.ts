import _ from 'lodash';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { EnvironmentType } from '@/react/portainer/environments/types';

import { DeploymentType, EdgeStack } from '../../types';

export function useAllowKubeToSelectCompose(edgeStack: EdgeStack) {
  const edgeGroupsQuery = useEdgeGroups();

  const initiallyContainsKubeEnv = _.compact(
    edgeStack.EdgeGroups.map(
      (id) => edgeGroupsQuery.data?.find((e) => e.Id === id)
    )
  )
    .flatMap((group) => group.EndpointTypes)
    .includes(EnvironmentType.EdgeAgentOnKubernetes);

  return (
    initiallyContainsKubeEnv &&
    edgeStack.DeploymentType === DeploymentType.Compose
  );
}
