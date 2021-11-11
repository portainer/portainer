import './ldap-settings-custom.css';
import controller from './ldap-settings-custom.controller';

export const ldapSettingsCustom = {
  templateUrl: './ldap-settings-custom.html',
  controller,
  bindings: {
    settings: '=',
    tlscaCert: '=',
    state: '=',
    onTlscaCertChange: '<',
    connectivityCheck: '<',
    onSearchUsersClick: '<',
    onSearchGroupsClick: '<',
    onSaveSettings: '<',
    saveButtonState: '<',
    saveButtonDisabled: '<',
  },
};
