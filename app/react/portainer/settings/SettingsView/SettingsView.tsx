import angular from 'angular';

import { StateManager } from '@/portainer/services/types';

import { PageHeader } from '@@/PageHeader';

import { Settings } from '../types';
import { isBE } from '../../feature-flags/feature-flags.service';

import { ApplicationSettingsPanel } from './ApplicationSettingsPanel';
import { BackupSettingsPanel } from './BackupSettingsView';
import { HelmCertPanel } from './HelmCertPanel';
import { HiddenContainersPanel } from './HiddenContainersPanel/HiddenContainersPanel';
import { KubeSettingsPanel } from './KubeSettingsPanel';
import { SSLSettingsPanelWrapper } from './SSLSettingsPanel/SSLSettingsPanel';
import { ExperimentalFeatures } from './ExperimentalFeatures';

export function SettingsView() {
  return (
    <>
      <PageHeader title="Settings" breadcrumbs="Settings" />

      <div className="mx-4 space-y-4">
        <ApplicationSettingsPanel onSuccess={handleSuccess} />

        <KubeSettingsPanel />

        <HelmCertPanel />

        <SSLSettingsPanelWrapper />

        {isBE && <ExperimentalFeatures />}

        <HiddenContainersPanel />

        <BackupSettingsPanel />
      </div>
    </>
  );
}

function handleSuccess(settings: Settings) {
  // to sync "outside state" - for angularjs
  // this is a hack, but it works
  // state manager should be replaced with a non angular solution, maybe using zustand
  const $injector = angular.element(document).injector();
  $injector.invoke(
    /* @ngInject */ (StateManager: StateManager) => {
      StateManager?.updateLogo(settings.LogoURL);
      StateManager?.updateSnapshotInterval(settings.SnapshotInterval);
      StateManager?.updateEnableTelemetry(settings.EnableTelemetry);
    }
  );
}
