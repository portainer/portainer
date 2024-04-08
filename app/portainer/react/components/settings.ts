import angular from 'angular';

import { SettingsFDO } from '@/react/portainer/settings/EdgeComputeView/SettingsFDO';
import { SettingsOpenAMT } from '@/react/portainer/settings/EdgeComputeView/SettingsOpenAMT';
import { InternalAuth } from '@/react/portainer/settings/AuthenticationView/InternalAuth';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { LDAPUsersTable } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LDAPUsersTable';
import { LDAPGroupsTable } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LDAPGroupsTable';

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
  .component('ldapUsersDatatable', r2a(LDAPUsersTable, ['dataset']))
  .component('ldapGroupsDatatable', r2a(LDAPGroupsTable, ['dataset'])).name;
