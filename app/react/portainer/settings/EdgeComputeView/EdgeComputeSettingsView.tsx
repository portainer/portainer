import { Settings } from '@/react/portainer/settings/types';

import { isBE } from '../../feature-flags/feature-flags.service';

import { EdgeComputeSettings } from './EdgeComputeSettings';
import { DeploymentSyncOptions } from './DeploymentSyncOptions/DeploymentSyncOptions';
import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';
import { FormValues } from './EdgeComputeSettings/types';

interface Props {
  settings: Settings;
  onSubmit(values: FormValues): void;
}

export function EdgeComputeSettingsView({ settings, onSubmit }: Props) {
  return (
    <div className="row">
      <EdgeComputeSettings settings={settings} onSubmit={onSubmit} />

      <DeploymentSyncOptions />

      {isBE && <AutomaticEdgeEnvCreation />}
    </div>
  );
}
