import angular from 'angular';
import ldapModule from './ldap';
import { autoUserProvisionToggle } from './auto-user-provision-toggle';
import { saveAuthSettingsButton } from './save-auth-settings-button';
import { internalAuth } from './internal-auth';

export default angular
  .module('portainer.settings.authentication', [ldapModule])
  .component('internalAuth', internalAuth)
  .component('saveAuthSettingsButton', saveAuthSettingsButton)
  .component('autoUserProvisionToggle', autoUserProvisionToggle).name;
