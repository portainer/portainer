angular.module('portainer.rest')
.factory('Stack', ['$resource', 'STACK_ENDPOINT', function StackFactory($resource, STACK_ENDPOINT) {
  'use strict';
  return $resource(STACK_ENDPOINT, {}, {
    create: { method: 'POST' }
  });
}]);
