import angular from 'angular';

import { NetworkDetailsViewAngular } from './edit';

export const networksModule = angular
  .module('portainer.docker.networks', [])
  .component('networkDetailsView', NetworkDetailsViewAngular).name;
