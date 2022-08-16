import { buildLdapSettingsModel, buildOpenLDAPSettingsModel } from '@/portainer/settings/authentication/ldap/ldap-settings.model';
import { options } from './ldap-options';

const SERVER_TYPES = {
  CUSTOM: 0,
  OPEN_LDAP: 1,
  AD: 2,
};

const DEFAULT_GROUP_FILTER = '(objectClass=groupOfNames)';
const DEFAULT_USER_FILTER = '(objectClass=inetOrgPerson)';

export default class LdapSettingsController {
  /* @ngInject */
  constructor(LDAPService) {
    Object.assign(this, { LDAPService, SERVER_TYPES });

    this.tlscaCert = null;
    this.settingsDrafts = {};

    this.boxSelectorOptions = options;

    this.onTlscaCertChange = this.onTlscaCertChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.searchGroups = this.searchGroups.bind(this);
    this.onChangeServerType = this.onChangeServerType.bind(this);
  }

  onTlscaCertChange(file) {
    this.tlscaCert = file;
  }

  $onInit() {
    this.tlscaCert = this.settings.TLSConfig.TLSCACert;
  }

  onChangeServerType(serverType) {
    this.settingsDrafts[this.settings.ServerType] = this.settings;

    if (this.settingsDrafts[serverType]) {
      this.settings = this.settingsDrafts[serverType];
      return;
    }

    switch (serverType) {
      case SERVER_TYPES.OPEN_LDAP:
        this.settings = buildOpenLDAPSettingsModel();
        break;
      case SERVER_TYPES.CUSTOM:
        this.settings = buildLdapSettingsModel();
        break;
    }
  }

  searchUsers() {
    const settings = {
      ...this.settings,
      SearchSettings: this.settings.SearchSettings.map((search) => ({ ...search, Filter: search.Filter || DEFAULT_USER_FILTER })),
    };
    return this.LDAPService.users(settings);
  }

  searchGroups() {
    const settings = {
      ...this.settings,
      GroupSearchSettings: this.settings.GroupSearchSettings.map((search) => ({ ...search, GroupFilter: search.GroupFilter || DEFAULT_GROUP_FILTER })),
    };
    return this.LDAPService.groups(settings);
  }
}
