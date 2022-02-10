import angular from 'angular';

import { CreateContainerInstanceViewAngular } from './CreateContainerInstanceView';

export const containerInstancesModule = angular
  .module('portainer.azure.containerInstances', [])

  .component(
    'createContainerInstanceView',
    CreateContainerInstanceViewAngular
  ).name;
