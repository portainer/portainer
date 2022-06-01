import { useState } from 'react';

import { BoxSelector } from '@/portainer/components/BoxSelector';
import {
  Environment,
  EnvironmentCreationTypes,
} from '@/portainer/environments/types';
import { BoxSelectorOption } from '@/portainer/components/BoxSelector/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';

import { AgentPanel } from './AgentPanel';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

const options: BoxSelectorOption<
  | EnvironmentCreationTypes.AgentEnvironment
  | EnvironmentCreationTypes.EdgeAgentEnvironment
>[] = [
  {
    id: 'agent_endpoint',
    icon: 'fa fa-bolt',
    label: 'Agent',
    value: EnvironmentCreationTypes.AgentEnvironment,
    description: '',
  },
  {
    id: 'edgeAgent',
    icon: 'fa fa-cloud', // Todo cloud with docker
    label: 'Edge Agent',
    description: '',
    value: EnvironmentCreationTypes.EdgeAgentEnvironment,
  },
];

export function WizardKubernetes({ onCreate }: Props) {
  const [creationType, setCreationType] = useState(options[0].value);

  const tab = getTab(creationType);

  return (
    <div className="form-horizontal">
      <BoxSelector
        onChange={(v) => setCreationType(v)}
        options={options}
        value={creationType}
        radioName="creation-type"
      />

      {tab}
    </div>
  );

  function getTab(type: typeof options[number]['value']) {
    switch (type) {
      case EnvironmentCreationTypes.AgentEnvironment:
        return (
          <AgentPanel
            onCreate={(environment) => onCreate(environment, 'kubernetesAgent')}
          />
        );
      case EnvironmentCreationTypes.EdgeAgentEnvironment:
        return (
          <EdgeAgentTab
            onCreate={(environment) =>
              onCreate(environment, 'kubernetesEdgeAgent')
            }
            commands={[{ ...commandsTabs.k8sLinux, label: 'Linux' }]}
          />
        );
      default:
        throw new Error('Creation type not supported');
    }
  }
}
