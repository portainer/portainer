import angular from 'angular';

import { CreateTeamFormAngular } from './CreateTeamForm';

export default angular
  .module('portainer.app.teams', [])

  .component('createTeamForm', CreateTeamFormAngular).name;
