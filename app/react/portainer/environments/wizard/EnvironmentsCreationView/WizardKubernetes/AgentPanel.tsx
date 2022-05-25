import { Environment } from '@/portainer/environments/types';

import { AgentForm } from '../shared/AgentForm/AgentForm';
import { AnalyticsStateKey } from '../types';

import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

export function AgentPanel({ onCreate }: Props) {
  return (
    <>
      <DeploymentScripts />

      <AgentForm
        onCreate={(environment) => onCreate(environment, 'kubernetesAgent')}
      />
    </>
  );
}
