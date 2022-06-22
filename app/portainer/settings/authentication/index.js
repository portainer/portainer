import angular from 'angular';
import ldapModule from './ldap';
import { autoUserProvisionToggle } from './auto-user-provision-toggle';
import { saveAuthSettingsButton } from './save-auth-settings-button';
import { InternalAuthAngular } from './internal-auth';

export default angular
  .module('portainer.settings.authentication', [ldapModule])
  .component('internalAuth', InternalAuthAngular)
  .component('saveAuthSettingsButton', saveAuthSettingsButton)
  .component('autoUserProvisionToggle', autoUserProvisionToggle).name;
