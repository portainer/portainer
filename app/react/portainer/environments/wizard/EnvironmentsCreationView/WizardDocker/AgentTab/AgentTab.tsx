import { Environment } from '@/react/portainer/environments/types';

import { AgentForm } from '../../shared/AgentForm/AgentForm';

import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment): void;
  isDockerStandalone?: boolean;
}

export function AgentTab({ onCreate, isDockerStandalone }: Props) {
  return (
    <>
      <DeploymentScripts isDockerStandalone={isDockerStandalone} />

      <div className="mt-5">
        <AgentForm onCreate={onCreate} />
      </div>
    </>
  );
}
