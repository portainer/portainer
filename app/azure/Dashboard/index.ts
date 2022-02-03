import angular from 'angular';

import { DashboardViewAngular } from './DashboardView';

export const dashboardModule = angular
  .module('portainer.azure.dashboard', [])

  .component('dashboardView', DashboardViewAngular).name;
