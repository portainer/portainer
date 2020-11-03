const SERVER_TYPES = {
  CUSTOM: 0,
  OPEN_LDAP: 1,
  AD: 2,
};

export default class LdapSettingsController {
  /* @ngInject */
  constructor(LDAPService) {
    Object.assign(this, { LDAPService, SERVER_TYPES });

    this.tlscaCert = null;

    this.boxSelectorOptions = [
      { id: 'ldap_custom', value: SERVER_TYPES.CUSTOM, label: 'Custom', icon: 'fa fa-server' },
      { id: 'ldap_openldap', value: SERVER_TYPES.OPEN_LDAP, label: 'OpenLDAP', icon: 'fa fa-server' },
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
    this.settings.SearchSettings.forEach((search) => {
      search.UserNameAttribute = 'uid';
      search.Filter = search.Filter || '(objectClass=inetOrgPerson)';
    });
    this.settings.GroupSearchSettings.forEach((search) => {
      search.GroupAttribute = 'member';
      search.GroupFilter = search.GroupFilter || '(objectClass=groupOfNames)';
    });
  }

  searchUsers() {
    return this.LDAPService.users(this.settings);
  }

  searchGroups() {
    return this.LDAPService.groups(this.settings);
  }
}
