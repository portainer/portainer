angular.module('portainer.app').factory('EndpointGroups', [
  '$resource',
  'API_ENDPOINT_ENDPOINT_GROUPS',
  function EndpointGroupsFactory($resource, API_ENDPOINT_ENDPOINT_GROUPS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINT_GROUPS + '/:id/:action',
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'PUT', params: { id: '@id' } },
        updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
        addEndpoint: { method: 'PUT', params: { id: '@id', action: '@action' } },
        removeEndpoint: { method: 'DELETE', params: { id: '@id', action: '@action' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
