import angular from 'angular';

import { RegistryRepositoriesController } from './controller.js';

angular.module('portainer.registrymanagement').component('registryRepositoriesView', {
  templateUrl: './template.html',
  controller: RegistryRepositoriesController,
});
