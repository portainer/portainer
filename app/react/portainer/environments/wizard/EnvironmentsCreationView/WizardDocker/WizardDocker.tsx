import { useState } from 'react';

import { BoxSelector, buildOption } from '@/portainer/components/BoxSelector';
import { Environment } from '@/portainer/environments/types';

import { AnalyticsStateKey } from '../types';

import { AgentTab } from './AgentTab';
import { APITab } from './APITab';
import { SocketTab } from './SocketTab';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

const options = [
  buildOption('Agent', 'fa fa-bolt', 'Agent', '', 'agent'),
  buildOption('API', 'fa fa-cloud', 'API', '', 'api'),
  buildOption('Socket', 'fab fa-docker', 'Socket', '', 'socket'),
];

export function WizardDocker({ onCreate }: Props) {
  const [creationType, setCreationType] = useState(options[0].value);

  const form = getForm(creationType);

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

      {form}
    </div>
  );

  function getForm(creationType: 'agent' | 'api' | 'socket') {
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
      default:
        return null;
    }
  }
}
