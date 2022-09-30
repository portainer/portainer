angular.module('portainer.app').factory('Scenes', [
  '$resource',
  'API_ENDPOINT_SCENES',
  function SceneFactory($resource, API_ENDPOINT_SCENES) {
    'use strict';
    return $resource(
      API_ENDPOINT_SCENES + '/:id/:action',
      {},
      {
        get: { method: 'GET', params: { id: '@id' } },
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        update: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
