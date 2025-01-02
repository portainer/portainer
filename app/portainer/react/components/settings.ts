import angular from 'angular';

import { SettingsOpenAMT } from '@/react/portainer/settings/EdgeComputeView/SettingsOpenAMT';
import { InternalAuth } from '@/react/portainer/settings/AuthenticationView/InternalAuth';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { LDAPUsersTable } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LDAPUsersTable';
import { LDAPGroupsTable } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LDAPGroupsTable';
import { ApplicationSettingsPanel } from '@/react/portainer/settings/SettingsView/ApplicationSettingsPanel';
import { KubeSettingsPanel } from '@/react/portainer/settings/SettingsView/KubeSettingsPanel';
import { HelmCertPanel } from '@/react/portainer/settings/SettingsView/HelmCertPanel';
import { HiddenContainersPanel } from '@/react/portainer/settings/SettingsView/HiddenContainersPanel/HiddenContainersPanel';
import { SSLSettingsPanelWrapper } from '@/react/portainer/settings/SettingsView/SSLSettingsPanel/SSLSettingsPanel';
import { AuthStyleField } from '@/react/portainer/settings/AuthenticationView/OAuth';

export const settingsModule = angular
  .module('portainer.app.react.components.settings', [])
  .component('settingsOpenAmt', r2a(SettingsOpenAMT, ['onSubmit', 'settings']))
  .component(
    'internalAuth',
    r2a(InternalAuth, ['onSaveSettings', 'isLoading', 'value', 'onChange'])
  )
  .component('ldapUsersDatatable', r2a(LDAPUsersTable, ['dataset']))
  .component('ldapGroupsDatatable', r2a(LDAPGroupsTable, ['dataset']))
  .component(
    'applicationSettingsPanel',
    r2a(withReactQuery(ApplicationSettingsPanel), ['onSuccess', 'settings'])
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
    r2a(withUIRouter(withReactQuery(KubeSettingsPanel)), ['settings'])
  )
  .component(
    'oauthAuthStyle',
    r2a(AuthStyleField, [
      'value',
      'onChange',
      'label',
      'tooltip',
      'readonly',
      'size',
    ])
  ).name;
