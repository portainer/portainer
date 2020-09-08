import angular from 'angular';

import { ConfigureRegistryController } from './controller';

angular.module('portainer.registrymanagement').component('configureRegistryView', {
  templateUrl: './template.html',
  controller: ConfigureRegistryController,
});
