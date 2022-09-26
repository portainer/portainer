import { Settings } from '@/react/portainer/settings/types';

import { EdgeComputeSettings } from './EdgeComputeSettings';
import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';

interface Props {
  settings: Settings;
  onSubmit(values: Settings): void;
}

export function EdgeComputeSettingsView({ settings, onSubmit }: Props) {
  return (
    <div className="row">
      <EdgeComputeSettings settings={settings} onSubmit={onSubmit} />

      {process.env.PORTAINER_EDITION === 'BE' && <AutomaticEdgeEnvCreation />}
    </div>
  );
}
