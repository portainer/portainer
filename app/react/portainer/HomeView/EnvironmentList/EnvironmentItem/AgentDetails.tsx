import { Environment } from '@/react/portainer/environments/types';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

export function AgentDetails({ environment }: { environment: Environment }) {
  if (!isAgentEnvironment(environment.Type)) {
    return null;
  }

  return <span>{environment.Agent.Version}</span>;
}
