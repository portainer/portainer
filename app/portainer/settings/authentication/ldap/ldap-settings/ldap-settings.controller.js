const SERVER_TYPES = {
  CUSTOM: 0,
  OPEN_LDAP: 1,
  AD: 2,
};

import { buildOpenLDAPSettingsModel } from '@/portainer/settings/authentication/ldap/ldap-settings.model';
import { EXTERNAL_AUTH_LDAP } from '@/portainer/feature-flags/feature-ids';

const DEFAULT_GROUP_FILTER = '(objectClass=groupOfNames)';
const DEFAULT_USER_FILTER = '(objectClass=inetOrgPerson)';

export default class LdapSettingsController {
  /* @ngInject */
  constructor(LDAPService) {
    Object.assign(this, { LDAPService, SERVER_TYPES });

    this.tlscaCert = null;

    this.boxSelectorOptions = [
      { id: 'ldap_custom', value: SERVER_TYPES.CUSTOM, label: 'Custom', icon: 'fa fa-server' },
      { id: 'ldap_openldap', value: SERVER_TYPES.OPEN_LDAP, label: 'OpenLDAP', icon: 'fa fa-server', feature: EXTERNAL_AUTH_LDAP },
    ];

    this.onTlscaCertChange = this.onTlscaCertChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.searchGroups = this.searchGroups.bind(this);
    this.onChangeServerType = this.onChangeServerType.bind(this);
  }

  onTlscaCertChange(file) {
    this.tlscaCert = file;
  }

  $onInit() {
    this.tlscaCert = this.settings.TLSCACert;
  }

  onChangeServerType(serverType) {
    switch (serverType) {
      case SERVER_TYPES.OPEN_LDAP:
        return this.onChangeToOpenLDAP();
      default:
        break;
    }
  }

  onChangeToOpenLDAP() {
    this.settings = buildOpenLDAPSettingsModel();
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
