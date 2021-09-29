import angular from 'angular';

import ldapModule from './ldap';

import { autoUserProvisionToggle } from './auto-user-provision-toggle';

export default angular
  .module('portainer.settings.authentication', [ldapModule])

  .component('autoUserProvisionToggle', autoUserProvisionToggle).name;
