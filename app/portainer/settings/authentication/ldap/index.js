import angular from 'angular';

import { adSettings } from './ad-settings';
import { ldapSettings } from './ldap-settings';
import { ldapSettingsCustom } from './ldap-settings-custom';
import { ldapSettingsOpenLdap } from './ldap-settings-openldap';

import { ldapConnectivityCheck } from './ldap-connectivity-check';
import { ldapGroupsDatatable } from './ldap-groups-datatable';
import { ldapGroupSearch } from './ldap-group-search';
import { ldapGroupSearchItem } from './ldap-group-search-item';
import { ldapUserSearch } from './ldap-user-search';
import { ldapUserSearchItem } from './ldap-user-search-item';
import { ldapSettingsDnBuilder } from './ldap-settings-dn-builder';
import { ldapSettingsGroupDnBuilder } from './ldap-settings-group-dn-builder';
import { ldapCustomGroupSearch } from './ldap-custom-group-search';
import { ldapCustomAdminGroup } from './ldap-custom-admin-group';
import { ldapSettingsSecurity } from './ldap-settings-security';
import { ldapSettingsTestLogin } from './ldap-settings-test-login';
import { ldapCustomUserSearch } from './ldap-custom-user-search';
import { ldapUsersDatatable } from './ldap-users-datatable';
import { LDAPService } from './ldap.service';
import { LDAP } from './ldap.rest';

export default angular
  .module('portainer.settings.authentication.ldap', [])
  .service('LDAPService', LDAPService)
  .service('LDAP', LDAP)
  .component('ldapConnectivityCheck', ldapConnectivityCheck)
  .component('ldapGroupsDatatable', ldapGroupsDatatable)
  .component('ldapSettings', ldapSettings)
  .component('adSettings', adSettings)
  .component('ldapGroupSearch', ldapGroupSearch)
  .component('ldapGroupSearchItem', ldapGroupSearchItem)
  .component('ldapUserSearch', ldapUserSearch)
  .component('ldapUserSearchItem', ldapUserSearchItem)
  .component('ldapSettingsCustom', ldapSettingsCustom)
  .component('ldapSettingsDnBuilder', ldapSettingsDnBuilder)
  .component('ldapSettingsGroupDnBuilder', ldapSettingsGroupDnBuilder)
  .component('ldapCustomGroupSearch', ldapCustomGroupSearch)
  .component('ldapCustomAdminGroup', ldapCustomAdminGroup)
  .component('ldapSettingsOpenLdap', ldapSettingsOpenLdap)
  .component('ldapSettingsSecurity', ldapSettingsSecurity)
  .component('ldapSettingsTestLogin', ldapSettingsTestLogin)
  .component('ldapCustomUserSearch', ldapCustomUserSearch)
  .component('ldapUsersDatatable', ldapUsersDatatable).name;
