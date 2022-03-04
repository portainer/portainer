angular.module('portainer.azure').factory('Subscription', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function SubscriptionFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:id',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2016-06-01',
      },
      {
        get: { method: 'GET', params: { id: '@id' } },
      }
    );
  },
]);
