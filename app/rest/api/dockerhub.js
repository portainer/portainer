angular.module('portainer.rest')
.factory('DockerHub', ['$resource', 'DOCKERHUB_ENDPOINT', function DockerHubFactory($resource, DOCKERHUB_ENDPOINT) {
  'use strict';
  return $resource(DOCKERHUB_ENDPOINT, {}, {
    get: { method: 'GET' },
    update: { method: 'PUT' }
  });
}]);
