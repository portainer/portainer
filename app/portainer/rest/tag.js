const API_ENDPOINT_TAGS = 'api/tags';

angular.module('portainer.app').factory('Tags', [
  '$resource',
  function TagsFactory($resource) {
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
