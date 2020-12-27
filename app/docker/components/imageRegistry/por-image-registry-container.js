import angular from 'angular';

import controller from './por-image-registry-container.controller';

angular.module('portainer.docker').component('porImageRegistryContainer', {
  bindings: {
    endpoint: '<',
    setValidity: '<',
    isAdmin: '<',
    isDockerHubRegistry: '<',
    isAuthenticated: '<',
  },
  controller,
  transclude: {
    rateLimitExceeded: '?porImageRegistryRateLimitExceeded',
    fields: 'porImageRegistryFields',
  },
  templateUrl: './por-image-registry-container.html',
});
