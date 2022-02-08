import angular from 'angular';

import { ContainerQuickActionsAngular } from './container-quick-actions';

export const componentsModule = angular
  .module('portainer.docker.components', [])
  .component('containerQuickActions', ContainerQuickActionsAngular).name;
