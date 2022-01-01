import angular from 'angular';

import controller from './docker-features-configuration.controller';

angular.module('portainer.docker').component('dockerFeaturesConfigurationView', {
  templateUrl: './docker-features-configuration.html',
  controller,
  bindings: {
    endpoint: '<',
  },
});
