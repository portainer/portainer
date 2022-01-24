import angular from 'angular';

import { ContainerQuickActionsAngular } from './ContainerQuickActions';

angular
  .module('portainer.docker')
  .component('containerQuickActions', ContainerQuickActionsAngular);
