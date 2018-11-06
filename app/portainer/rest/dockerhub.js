angular.module('portainer.app')
.factory('DockerHub', ['$resource', 'API_ENDPOINT_DOCKERHUB', function DockerHubFactory($resource, API_ENDPOINT_DOCKERHUB) {
  'use strict';
  return $resource(API_ENDPOINT_DOCKERHUB, {}, {
    get: { method: 'GET' },
    update: { method: 'PUT' }
  });
}]);
