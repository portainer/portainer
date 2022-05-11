import angular from 'angular';

import { AccessControlPanelAngular } from './AccessControlPanel/AccessControlPanel';

export const accessControlModule = angular
  .module('portainer.access-control', [])
  .component('accessControlPanel', AccessControlPanelAngular).name;
