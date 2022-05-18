import { Environment } from '@/portainer/environments/types';

import { AgentForm } from '../shared/AgentForm';

import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment): void;
}

export function AgentPanel({ onCreate }: Props) {
  return (
    <>
      <DeploymentScripts />

      <AgentForm onCreate={onCreate} />
    </>
  );
}
