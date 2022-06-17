import { useState } from 'react';

import { Environment } from '@/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { BoxSelector, type BoxSelectorOption } from '@@/BoxSelector';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';

import { AgentTab } from './AgentTab';
import { APITab } from './APITab';
import { SocketTab } from './SocketTab';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

const options: BoxSelectorOption<'agent' | 'api' | 'socket' | 'edgeAgent'>[] = [
  {
    id: 'agent',
    icon: 'fa fa-bolt',
    label: 'Agent',
    description: '',
    value: 'agent',
  },
  {
    id: 'api',
    icon: 'fa fa-cloud',
    label: 'API',
    description: '',
    value: 'api',
  },
  {
    id: 'socket',
    icon: 'fab fa-docker',
    label: 'Socket',
    description: '',
    value: 'socket',
  },
  {
    id: 'edgeAgent',
    icon: 'fa fa-cloud', // Todo cloud with docker
    label: 'Edge Agent',
    description: '',
    value: 'edgeAgent',
  },
];

export function WizardDocker({ onCreate }: Props) {
  const [creationType, setCreationType] = useState(options[0].value);

  const tab = getTab(creationType);

  return (
    <div className="form-horizontal">
      <div className="form-group">
        <div className="col-sm-12">
          <BoxSelector
            onChange={(v) => setCreationType(v)}
            options={options}
            value={creationType}
            radioName="creation-type"
          />
        </div>
      </div>

      {tab}
    </div>
  );

  function getTab(creationType: 'agent' | 'api' | 'socket' | 'edgeAgent') {
    switch (creationType) {
      case 'agent':
        return (
          <AgentTab
            onCreate={(environment) => onCreate(environment, 'dockerAgent')}
          />
        );
      case 'api':
        return (
          <APITab
            onCreate={(environment) => onCreate(environment, 'dockerApi')}
          />
        );
      case 'socket':
        return (
          <SocketTab
            onCreate={(environment) => onCreate(environment, 'localEndpoint')}
          />
        );
      case 'edgeAgent':
        return (
          <EdgeAgentTab
            onCreate={(environment) => onCreate(environment, 'dockerEdgeAgent')}
            commands={{
              linux: [commandsTabs.swarmLinux, commandsTabs.standaloneLinux],
              win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
            }}
          />
        );
      default:
        return null;
    }
  }
}
