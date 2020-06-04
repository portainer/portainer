angular.module('portainer.azure').factory('Location', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function LocationFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/locations',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2016-06-01',
      },
      {
        query: { method: 'GET', params: { subscriptionId: '@subscriptionId' } },
      }
    );
  },
]);
