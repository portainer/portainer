import { Globe } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

export function AgentDetails({ environment }: { environment: Environment }) {
  if (!isAgentEnvironment(environment.Type)) {
    return null;
  }

  return (
    <>
      <span>{environment.Agent.Version}</span>
      {environment.Edge.AsyncMode && (
        <span className="vertical-center gap-1">
          <Globe className="icon icon-sm space-right" aria-hidden="true" />
          Async Environment
        </span>
      )}
    </>
  );
}
