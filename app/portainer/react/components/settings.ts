import angular from 'angular';

import { InternalAuth } from '@/react/portainer/settings/AuthenticationView/InternalAuth';
import { AuthenticationMethodSelector } from '@/react/portainer/settings/AuthenticationView/AuthenticationMethodSelector';
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
import { AutoUserProvisionToggle } from '@/react/portainer/settings/AuthenticationView/AutoUserProvisionToggle/AutoUserProvisionToggle';
import { LdapSettingsTestLogin } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LdapSettingsTestLogin/LdapSettingsTestLogin';
import { SessionLifetimeSelect } from '@/react/portainer/settings/AuthenticationView/SessionLifetimeSelect';
import { LdapSecurityFieldset } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/LdapSecurityFieldset/LdapSecurityFieldset';
import { DnBuilder } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/DnEntriesField/DnBuilder';
import { GroupDnBuilder } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/DnEntriesField/GroupDnBuilder';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { AdminGroupsSectionCE } from '@/react/portainer/settings/AuthenticationView/LDAPAuth/AdminGroupsSection';

export const settingsModule = angular
  .module('portainer.app.react.components.settings', [])
  .component(
    'sessionLifetimeSelect',
    r2a(SessionLifetimeSelect, ['value', 'onChange'])
  )
  .component(
    'internalAuth',
    r2a(InternalAuth, ['onSaveSettings', 'isLoading', 'value', 'onChange'])
  )
  .component(
    'authenticationMethodSelector',
    r2a(AuthenticationMethodSelector, ['value', 'onChange'])
  )
  .component('ldapUsersDatatable', r2a(LDAPUsersTable, ['dataset']))
  .component('ldapGroupsDatatable', r2a(LDAPGroupsTable, ['dataset']))
  .component(
    'ldapSettingsDnBuilder',
    r2a(DnBuilder, ['value', 'onChange', 'suffix', 'label', 'limitedFeatureId'])
  )
  .component(
    'ldapSettingsGroupDnBuilder',
    r2a(GroupDnBuilder, [
      'value',
      'onChange',
      'suffix',
      'index',
      'onRemoveClick',
      'limitedFeatureId',
    ])
  )
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
  )
  .component(
    'autoUserProvisionToggle',
    r2a(AutoUserProvisionToggle, [
      'value',
      'onChange',
      'description',
      'data-cy',
    ])
  )
  .component(
    'ldapSettingsTestLogin',
    r2a(withReactQuery(LdapSettingsTestLogin), [
      'settings',
      'limitedFeatureId',
      'showBeIndicatorIfNeeded',
      'isLimitedFeatureSelfContained',
    ])
  )
  .component(
    'ldapSecurityFieldset',
    r2a(LdapSecurityFieldset, [
      'values',
      'onChange',
      'errors',
      'uploadState',
      'limitedFeatureId',
      'title',
    ])
  )
  .component(
    'ldapCustomAdminGroup',
    r2a(
      withReactQuery(
        withControlledInput(AdminGroupsSectionCE, {
          searchSettings: 'onSearchSettingsChange',
          autoPopulate: 'onAutoPopulateChange',
          selectedAdminGroups: 'onSelectedAdminGroupsChange',
        })
      ),
      [
        'searchSettings',
        'onSearchSettingsChange',
        'autoPopulate',
        'onAutoPopulateChange',
        'selectedAdminGroups',
        'onSelectedAdminGroupsChange',
        'limitedFeatureId',
        'isLimitedFeatureSelfContained',
      ]
    )
  ).name;
