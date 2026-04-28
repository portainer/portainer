import { AlertTriangle } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { Tooltip } from '@@/Tip/Tooltip';
import { Icon } from '@@/Icon';

export function AgentDetails({ environment }: { environment: Environment }) {
  if (!isAgentEnvironment(environment.Type)) {
    return null;
  }

  const { Version: agentVersion, IsOutdated } = environment.Agent;

  if (!IsOutdated) {
    return (
      <span className="small text-muted vertical-center font-medium">
        {agentVersion}
      </span>
    );
  }

  return (
    <span className="small text-muted vertical-center flex items-center gap-1 font-medium">
      <Icon icon={AlertTriangle} className="icon-warning" />
      <span className="icon-warning">{agentVersion || '< 2.15'}</span>
      <Tooltip message="A newer agent version is available. Upgrade to access the latest features and bug fixes." />
    </span>
  );
}
