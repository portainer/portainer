import { r2a } from '@/react-tools/react2angular';

import { EdgeComputeSettings } from './EdgeComputeSettings';
import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';
import { Settings } from './types';

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

export const EdgeComputeSettingsViewAngular = r2a(EdgeComputeSettingsView, [
  'settings',
  'onSubmit',
]);
