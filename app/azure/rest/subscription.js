angular.module('portainer.azure').factory('Subscription', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function SubscriptionFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/azure/subscriptions/:id`,
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2016-06-01',
      },
      {
        query: { method: 'GET' },
        get: { method: 'GET', params: { id: '@id' } },
      }
    );
  },
]);
