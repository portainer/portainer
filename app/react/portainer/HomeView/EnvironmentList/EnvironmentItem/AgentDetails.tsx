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
  if (!isAgentEnvironment(environment.Type)) {
    return null;
  }

  if (isEdgeEnvironment(environment.Type)) {
    return <EdgeAgentDetails environment={environment} />;
  }

  return <span>{environment.Agent.Version}</span>;
}

function EdgeAgentDetails({ environment }: { environment: Environment }) {
  const { data: systemStatus } = useSystemStatus();
  const associated = !!environment.EdgeID;

  if (!systemStatus || !associated) {
    return null;
  }

  const agentVersion = environment.Agent.Version;

  const { Version } = systemStatus;
  const isSmaller =
    !agentVersion || // agents before 2.15 don't send the version so it will be empty
    isVersionSmaller(agentVersion, Version);

  if (!isSmaller) {
    return <span>{agentVersion}</span>;
  }

  return (
    <span className="flex items-center gap-1">
      <Icon icon={AlertTriangle} className="icon-warning" />
      <span className="icon-warning">{agentVersion || '< 2.15'}</span>
      <Tooltip message="Features and bug fixes in your current Portainer Server release may not be available to this Edge Agent until it is upgraded." />
    </span>
  );
}
