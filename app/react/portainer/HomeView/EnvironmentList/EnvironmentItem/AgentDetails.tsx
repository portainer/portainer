import { AlertTriangle } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import {
  isAgentEnvironment,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import { isVersionSmaller } from '@/react/common/semver-utils';
import { useSystemStatus } from '@/react/portainer/system/useSystemStatus';

import { Tooltip } from '@@/Tip/Tooltip';
import { Icon } from '@@/Icon';

export function AgentDetails({ environment }: { environment: Environment }) {
  const { data: systemStatus } = useSystemStatus();

  if (!systemStatus || !isAgentEnvironment(environment.Type)) {
    return null;
  }

  const { Version } = systemStatus;
  const isSmallerEdge =
    environment.Agent.Version &&
    isVersionSmaller(environment.Agent.Version, Version) &&
    isEdgeEnvironment(environment.Type);

  return (
    <>
      {isSmallerEdge && (
        <span className="flex items-center gap-1">
          <Icon icon={AlertTriangle} className="icon-warning" />
          <span className="icon-warning">{environment.Agent.Version}</span>
          <Tooltip message="Features and bug fixes in your current Portainer Server release may not be available to this Edge Agent until it is upgraded." />
        </span>
      )}
      {!isSmallerEdge && <span>{environment.Agent.Version}</span>}
    </>
  );
}
