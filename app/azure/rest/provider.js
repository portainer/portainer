angular.module('portainer.azure').factory('Provider', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ProviderFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/azure/subscriptions/:subscriptionId/providers/:providerNamespace`,
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
