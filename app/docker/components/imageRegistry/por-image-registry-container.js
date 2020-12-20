import angular from 'angular';

import controller from './por-image-registry-container.controller';

angular.module('portainer.docker').component('porImageRegistryContainer', {
  bindings: {
    endpoint: '<',
    setValidity: '<',
    isAdmin: '<',
    isDockerHubRegistry: '<',
    model: '<',
    checkRateLimits: '<',
  },
  controller,
  transclude: {
    rateLimitExceeded: '?porImageRegistryRateLimitExceeded',
    fields: 'porImageRegistryFields',
  },
  templateUrl: './por-image-registry-container.html',
});
