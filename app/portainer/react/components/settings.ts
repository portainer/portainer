import angular from 'angular';

import { SettingsFDO } from '@/react/portainer/settings/EdgeComputeView/SettingsFDO';
import { SettingsOpenAMT } from '@/react/portainer/settings/EdgeComputeView/SettingsOpenAMT';
import { InternalAuth } from '@/react/portainer/settings/AuthenticationView/InternalAuth';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ApplicationSettingsPanel } from '@/react/portainer/settings/SettingsView/ApplicationSettingsPanel';
import { KubeSettingsPanel } from '@/react/portainer/settings/SettingsView/KubeSettingsPanel';
import { HelmCertPanel } from '@/react/portainer/settings/SettingsView/HelmCertPanel';
import { HiddenContainersPanel } from '@/react/portainer/settings/SettingsView/HiddenContainersPanel/HiddenContainersPanel';
import { SSLSettingsPanelWrapper } from '@/react/portainer/settings/SettingsView/SSLSettingsPanel/SSLSettingsPanel';

export const settingsModule = angular
  .module('portainer.app.react.components.settings', [])
  .component(
    'settingsFdo',
    r2a(withUIRouter(withReactQuery(SettingsFDO)), ['onSubmit', 'settings'])
  )
  .component('settingsOpenAmt', r2a(SettingsOpenAMT, ['onSubmit', 'settings']))
  .component(
    'internalAuth',
    r2a(InternalAuth, ['onSaveSettings', 'isLoading', 'value', 'onChange'])
  )
  .component(
    'applicationSettingsPanel',
    r2a(withReactQuery(ApplicationSettingsPanel), ['onSuccess'])
  )
  .component(
    'sslSettingsPanel',
    r2a(withReactQuery(SSLSettingsPanelWrapper), [])
  )
  .component('helmCertPanel', r2a(withReactQuery(HelmCertPanel), []))
  .component(
    'hiddenContainersPanel',
    r2a(withUIRouter(withReactQuery(HiddenContainersPanel)), [])
  )
  .component(
    'kubeSettingsPanel',
    r2a(withUIRouter(withReactQuery(KubeSettingsPanel)), [])
  ).name;
