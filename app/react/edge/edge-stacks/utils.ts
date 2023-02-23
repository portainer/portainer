import _ from 'lodash';

import { EnvironmentType } from '@/react/portainer/environments/types';

import { EditorType } from './types';

export function getValidEditorTypes(
  endpointTypes: EnvironmentType[],
  allowKubeToSelectCompose?: boolean
) {
  const right: Partial<Record<EnvironmentType, EditorType[]>> = {
    [EnvironmentType.EdgeAgentOnDocker]: [EditorType.Compose],
    [EnvironmentType.EdgeAgentOnKubernetes]: allowKubeToSelectCompose
      ? [EditorType.Kubernetes, EditorType.Compose]
      : [EditorType.Kubernetes],
  };

  return endpointTypes.length
    ? _.intersection(...endpointTypes.map((type) => right[type]))
    : [EditorType.Compose, EditorType.Kubernetes];
}
