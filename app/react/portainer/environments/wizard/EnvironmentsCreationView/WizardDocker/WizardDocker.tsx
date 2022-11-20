import { useState } from 'react';
import { Zap, Cloud, Network, Plug2 } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { BoxSelector, type BoxSelectorOption } from '@@/BoxSelector';
import { BadgeIcon } from '@@/BadgeIcon';

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
    icon: <BadgeIcon icon={Zap} size="3xl" />,
    label: 'Agent',
    description: '',
    value: 'agent',
  },
  {
    id: 'api',
    icon: <BadgeIcon icon={Network} size="3xl" />,
    label: 'API',
    description: '',
    value: 'api',
  },
  {
    id: 'socket',
    icon: <BadgeIcon icon={Plug2} size="3xl" />,
    label: 'Socket',
    description: '',
    value: 'socket',
  },
  {
    id: 'edgeAgent',
    icon: <BadgeIcon icon={Cloud} size="3xl" />,
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
