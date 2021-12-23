import angular from 'angular';

import { EnvironmentListAngular } from './EnvironmentList';
import { HomeViewAngular } from './HomeView';

export default angular
  .module('portainer.app.home', [])
  .component('homeView', HomeViewAngular)
  .component('environmentList', EnvironmentListAngular).name;
