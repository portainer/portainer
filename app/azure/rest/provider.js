angular.module('portainer.azure').factory('Provider', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ProviderFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/providers/:providerNamespace',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2018-02-01',
      },
      {
        get: { method: 'GET', params: { subscriptionId: '@subscriptionId', providerNamespace: '@providerNamespace' } },
      }
    );
  },
]);
