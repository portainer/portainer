import angular from 'angular';

import { EnvironmentListAngular } from './EnvironmentList';

export default angular
  .module('portainer.app.home', [])
  .component('environmentList', EnvironmentListAngular).name;
