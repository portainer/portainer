import _ from 'lodash';

import { EnvironmentType } from '@/react/portainer/environments/types';

import { EditorType } from './types';

export function getValidEditorTypes(endpointTypes: EnvironmentType[]) {
  const right: Partial<Record<EnvironmentType, EditorType[]>> = {
    [EnvironmentType.EdgeAgentOnDocker]: [EditorType.Compose],
    [EnvironmentType.EdgeAgentOnKubernetes]: [EditorType.Kubernetes],
  };

  return endpointTypes.length
    ? _.intersection(...endpointTypes.map((type) => right[type]))
    : [EditorType.Compose, EditorType.Kubernetes];
}
