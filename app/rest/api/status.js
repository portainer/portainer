angular.module('portainer.rest')
.factory('Status', ['$resource', 'STATUS_ENDPOINT', function StatusFactory($resource, STATUS_ENDPOINT) {
  'use strict';
  return $resource(STATUS_ENDPOINT, {}, {
    get: { method: 'GET' }
  });
}]);
