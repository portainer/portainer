angular.module('portainer.docker').factory('Node', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function NodeFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/nodes/:id/:action`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'POST', params: { id: '@id', action: 'update', version: '@version' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
