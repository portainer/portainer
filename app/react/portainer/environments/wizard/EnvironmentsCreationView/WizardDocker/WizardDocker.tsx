import { useState } from 'react';

import { Environment } from '@/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { BoxSelector, type BoxSelectorOption } from '@@/BoxSelector';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';
import { useFilterEdgeOptionsIfNeeded } from '../useOnlyEdgeOptions';

import { AgentTab } from './AgentTab';
import { APITab } from './APITab';
import { SocketTab } from './SocketTab';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
  isDockerStandalone?: boolean;
}

const defaultOptions: BoxSelectorOption<
  'agent' | 'api' | 'socket' | 'edgeAgent'
>[] = [
  {
    id: 'agent',
    icon: 'svg-agent',
    label: 'Agent',
    description: '',
    value: 'agent',
  },
  {
    id: 'api',
    icon: 'svg-api',
    label: 'API',
    description: '',
    value: 'api',
  },
  {
    id: 'socket',
    icon: 'svg-socket',
    label: 'Socket',
    description: '',
    value: 'socket',
  },
  {
    id: 'edgeAgent',
    icon: 'svg-edgeagent',
    label: 'Edge Agent',
    description: '',
    value: 'edgeAgent',
    hide: window.ddExtension,
  },
];

export function WizardDocker({ onCreate, isDockerStandalone }: Props) {
  const options = useFilterEdgeOptionsIfNeeded(defaultOptions, 'edgeAgent');

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

  function getTab(creationType: 'agent' | 'api' | 'socket' | 'edgeAgent') {
    switch (creationType) {
      case 'agent':
        return (
          <AgentTab
            onCreate={(environment) => onCreate(environment, 'dockerAgent')}
            isDockerStandalone={isDockerStandalone}
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
              linux: isDockerStandalone
                ? [commandsTabs.standaloneLinux]
                : [commandsTabs.swarmLinux],
              win: isDockerStandalone
                ? [commandsTabs.standaloneWindow]
                : [commandsTabs.swarmWindows],
            }}
          />
        );
      default:
        return null;
    }
  }
}
