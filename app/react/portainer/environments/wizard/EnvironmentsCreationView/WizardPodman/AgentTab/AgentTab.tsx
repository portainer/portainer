import { Environment } from '@/react/portainer/environments/types';

import { AgentForm } from '../../shared/AgentForm/AgentForm';

import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment): void;
}

export function AgentTab({ onCreate }: Props) {
  return (
    <>
      <DeploymentScripts />

      <div className="mt-5">
        <AgentForm onCreate={onCreate} containerEngine="podman" />
      </div>
    </>
  );
}
