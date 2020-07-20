angular.module('portainer.azure').factory('ContainerGroup', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ContainerGroupFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';

    var resource = {};

    var base = $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/azure/subscriptions/:subscriptionId/providers/Microsoft.ContainerInstance/containerGroups',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2018-04-01',
      },
      {
        query: { method: 'GET', params: { subscriptionId: '@subscriptionId' } },
      }
    );

    var withResourceGroup = $resource(
      API_ENDPOINT_ENDPOINTS +
        '/:endpointId/azure/subscriptions/:subscriptionId/resourceGroups/:resourceGroupName/providers/Microsoft.ContainerInstance/containerGroups/:containerGroupName',
      {
        endpointId: EndpointProvider.endpointID,
        'api-version': '2018-04-01',
      },
      {
        create: {
          method: 'PUT',
          params: {
            subscriptionId: '@subscriptionId',
            resourceGroupName: '@resourceGroupName',
            containerGroupName: '@containerGroupName',
          },
        },
        get: {
          method: 'GET',
        },
      }
    );

    resource.query = base.query;
    resource.create = withResourceGroup.create;
    resource.get = withResourceGroup.get;
    return resource;
  },
]);
