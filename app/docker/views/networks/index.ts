import angular from 'angular';

import { NetworkDetailsViewAngular } from './edit';

export default angular
  .module('portainer.docker.networks', [])
  .component('networkDetailsView', NetworkDetailsViewAngular).name;
