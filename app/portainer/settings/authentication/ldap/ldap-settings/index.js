import controller from './ldap-settings.controller';

export const ldapSettings = {
  templateUrl: './ldap-settings.html',
  controller,
  bindings: {
    settings: '=',
    state: '<',
    connectivityCheck: '<',
    onSaveSettings: '<',
    saveButtonState: '<',
    isLdapFormValid: '<',
  },
};
