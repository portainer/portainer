import { Zap } from 'react-feather';

import { EnvironmentType } from '@/react/portainer/environments/types';
import {
  isAgentEnvironment,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';

interface Props {
  type: EnvironmentType;
  version: string;
}

export function AgentVersionTag({ type, version }: Props) {
  if (!isAgentEnvironment(type)) {
    return null;
  }

  return (
    <span className="space-x-1">
      <span>
        + <Zap className="icon icon-xs vertical-center" aria-hidden="true" />
      </span>
      <span>{isEdgeEnvironment(type) ? 'Edge Agent' : 'Agent'}</span>

      <span>{version}</span>
    </span>
  );
}
