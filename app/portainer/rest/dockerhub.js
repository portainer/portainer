const API_ENDPOINT_DOCKERHUB = 'api/dockerhub';

angular.module('portainer.app').factory('DockerHub', [
  '$resource',
  function DockerHubFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_DOCKERHUB,
      {},
      {
        get: { method: 'GET' },
        update: { method: 'PUT' },
      }
    );
  },
]);
