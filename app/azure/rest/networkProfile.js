import angular from 'angular';

angular.module('portainer.azure').factory('NetworkProfile', NetworkProfileFactory);

/* @ngInject */
function NetworkProfileFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  return $resource(
    API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/providers/Microsoft.Network/networkProfiles',
    {
      endpointId: EndpointProvider.endpointID,
      'api-version': '2018-07-01',
    },
    {
      query: { method: 'GET', params: { subscriptionId: '@subscriptionId' } },
    }
  );
}
