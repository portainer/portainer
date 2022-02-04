import angular from 'angular';

import { DashboardViewAngular } from './DashboardView';

export default angular
  .module('portainer.azure.dashboard', [])
  .component('dashboardView', DashboardViewAngular).name;
