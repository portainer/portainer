import angular from 'angular';

import { RegistryRepositoryTagController } from './controller';

angular.module('portainer.registrymanagement').component('registryRepositoryTagView', {
  templateUrl: './template.html',
  controller: RegistryRepositoryTagController,
});
