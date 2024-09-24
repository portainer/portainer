import { useState } from 'react';
import { Zap, Network, Plug2 } from 'lucide-react';
import _ from 'lodash';

import {
  ContainerEngine,
  Environment,
} from '@/react/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import EdgeAgentStandardIcon from '@/react/edge/components/edge-agent-standard.svg?c';
import EdgeAgentAsyncIcon from '@/react/edge/components/edge-agent-async.svg?c';

import { BoxSelector, type BoxSelectorOption } from '@@/BoxSelector';
import { BadgeIcon } from '@@/BadgeIcon';
import { Alert } from '@@/Alert';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';

import { AgentTab } from './AgentTab';
import { APITab } from './APITab';
import { SocketTab } from './SocketTab';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
  isDockerStandalone?: boolean;
}

const options: BoxSelectorOption<
  'agent' | 'api' | 'socket' | 'edgeAgentStandard' | 'edgeAgentAsync'
>[] = _.compact([
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
    id: 'edgeAgentStandard',
    icon: <BadgeIcon icon={EdgeAgentStandardIcon} size="3xl" />,
    label: 'Edge Agent Standard',
    description: '',
    value: 'edgeAgentStandard',
  },
  isBE && {
    id: 'edgeAgentAsync',
    icon: <BadgeIcon icon={EdgeAgentAsyncIcon} size="3xl" />,
    label: 'Edge Agent Async',
    description: '',
    value: 'edgeAgentAsync',
  },
]);

const containerEngine = ContainerEngine.Docker;

export function WizardDocker({ onCreate, isDockerStandalone }: Props) {
  const [creationType, setCreationType] = useState(options[0].value);

  const tab = getTab(creationType);

  return (
    <div className="form-horizontal">
      {!isDockerStandalone && (
        <Alert color="warn" className="col-sm-12 mb-2">
          <div>
            Only do this <b>once</b> for your environment, regardless of how
            many nodes are in the cluster. You do <b>not</b> need to add each
            node as an individual environment in Portainer. Adding just one node
            (we recommend the manager node) will allow Portainer to manage the
            entire cluster.
          </div>
        </Alert>
      )}
      <BoxSelector
        onChange={(v) => setCreationType(v)}
        options={options}
        value={creationType}
        radioName="creation-type"
      />

      {tab}
    </div>
  );

  function getTab(
    creationType:
      | 'agent'
      | 'api'
      | 'socket'
      | 'edgeAgentStandard'
      | 'edgeAgentAsync'
  ) {
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
      case 'edgeAgentStandard':
        return (
          <EdgeAgentTab
            onCreate={(environment) =>
              onCreate(environment, 'dockerEdgeAgentStandard')
            }
            commands={{
              linux: isDockerStandalone
                ? [commandsTabs.standaloneLinux]
                : [commandsTabs.swarmLinux],
              win: isDockerStandalone
                ? [commandsTabs.standaloneWindow]
                : [commandsTabs.swarmWindows],
            }}
            containerEngine={containerEngine}
          />
        );
      case 'edgeAgentAsync':
        return (
          <EdgeAgentTab
            asyncMode
            onCreate={(environment) =>
              onCreate(environment, 'dockerEdgeAgentAsync')
            }
            commands={{
              linux: isDockerStandalone
                ? [commandsTabs.standaloneLinux]
                : [commandsTabs.swarmLinux],
              win: isDockerStandalone
                ? [commandsTabs.standaloneWindow]
                : [commandsTabs.swarmWindows],
            }}
            containerEngine={containerEngine}
          />
        );
      default:
        return null;
    }
  }
}
