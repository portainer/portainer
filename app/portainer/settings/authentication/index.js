import angular from 'angular';

import ldapModule from './ldap';

import { autoUserProvisionToggle } from './auto-user-provision-toggle';
import { autoTeamMembershipToggle } from './auto-team-membership-toggle';

export default angular
  .module('portainer.settings.authentication', [ldapModule])

  .component('autoUserProvisionToggle', autoUserProvisionToggle)
  .component('autoTeamMembershipToggle', autoTeamMembershipToggle).name;
