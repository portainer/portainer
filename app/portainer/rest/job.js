angular.module('portainer.app')
  .factory('Job', ['$resource', 'API_ENDPOINT_ENDPOINTS', function JobFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/:action', {}, {
      create: {
        method: 'POST',
        ignoreLoadingBar: true,
        params: {
          action: 'job'
        }
      }
    });
  }]);