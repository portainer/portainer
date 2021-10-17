angular.module('portainer.azure').factory('Location', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function LocationFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/azure/subscriptions/:subscriptionId/locations`,
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
