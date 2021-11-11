import controller from './ldap-settings-openldap.controller';

export const ldapSettingsOpenLdap = {
  templateUrl: './ldap-settings-openldap.html',
  controller,
  bindings: {
    settings: '=',
    tlscaCert: '=',
    state: '=',
    connectivityCheck: '<',
    onTlscaCertChange: '<',
    onSearchUsersClick: '<',
    onSearchGroupsClick: '<',
    onSaveSettings: '<',
    saveButtonState: '<',
    saveButtonDisabled: '<',
  },
};
