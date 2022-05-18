import { useState } from 'react';

import { BoxSelector } from '@/portainer/components/BoxSelector';
import {
  Environment,
  EnvironmentCreationTypes,
} from '@/portainer/environments/types';
import { BoxSelectorOption } from '@/portainer/components/BoxSelector/types';

import { AnalyticsStateKey } from '../types';

import { AgentPanel } from './AgentPanel';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

const options: BoxSelectorOption<EnvironmentCreationTypes.AgentEnvironment>[] =
  [
    {
      id: 'agent_endpoint',
      icon: 'fa fa-bolt',
      label: 'Agent',
      value: EnvironmentCreationTypes.AgentEnvironment,
      description: '',
    },
  ];

export function WizardKubernetes({ onCreate }: Props) {
  const [creationType, setCreationType] = useState(options[0].value);

  const Component = getPanel(creationType);

  return (
    <div className="form-horizontal">
      <BoxSelector
        onChange={(v) => setCreationType(v)}
        options={options}
        value={creationType}
        radioName="creation-type"
      />

      <Component onCreate={onCreate} />
    </div>
  );
}

function getPanel(type: typeof options[number]['value']) {
  switch (type) {
    case EnvironmentCreationTypes.AgentEnvironment:
      return AgentPanel;
    default:
      throw new Error('Creation type not supported');
  }
}
