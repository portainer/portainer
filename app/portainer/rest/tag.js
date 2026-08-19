angular.module('portainer.app').factory('Tags', [
  '$resource',
  'API_ENDPOINT_TAGS',
  function TagsFactory($resource, API_ENDPOINT_TAGS) {
    'use strict';
    return $resource(
      API_ENDPOINT_TAGS + '/:id',
      {},
      {
        create: { method: 'POST' },
        query: { method: 'GET', isArray: true },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
