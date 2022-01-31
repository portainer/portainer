import angular from 'angular';

import { CreateContainerInstanceViewAngular } from './CreateContainerInstanceView';
import { ContainerInstanceViewAngular } from './ContainerInstanceView';

export const containerInstancesModule = angular
  .module('portainer.azure.containerInstances', [])
  .component('containerInstanceView', ContainerInstanceViewAngular)
  .component(
    'createContainerInstanceView',
    CreateContainerInstanceViewAngular
  ).name;
