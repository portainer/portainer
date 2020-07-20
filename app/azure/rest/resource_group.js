angular.module('portainer.azure').factory('ResourceGroup', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ResourceGroupFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/resourcegroups/:resourceGroupName',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2018-02-01',
      },
      {
        query: { method: 'GET', params: { subscriptionId: '@subscriptionId' } },
        get: { method: 'GET' },
      }
    );
  },
]);
