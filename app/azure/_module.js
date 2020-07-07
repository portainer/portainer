angular.module('portainer.azure', ['portainer.app']).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    var azure = {
      name: 'azure',
      url: '/azure',
      parent: 'endpoint',
      abstract: true,
      resolve: {
        /* ngInject */
        endpointCheck($async, $state, endpoint, EndpointProvider, StateManager) {
          return $async(async () => {
            try {
              EndpointProvider.setEndpointID(endpoint.Id);
              EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
              EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
              await StateManager.updateEndpointState(endpoint, []);
            } catch (e) {
              $state.go('portainer.home', { error: e.message || e.msg }, { reload: true });
            }
          });
        },
      },
    };

    var containerInstances = {
      name: 'azure.containerinstances',
      url: '/containerinstances',
      views: {
        'content@': {
          templateUrl: './views/containerinstances/containerinstances.html',
          controller: 'AzureContainerInstancesController',
        },
      },
    };

    var containerInstanceCreation = {
      name: 'azure.containerinstances.new',
      url: '/new/',
      views: {
        'content@': {
          templateUrl: './views/containerinstances/create/createcontainerinstance.html',
          controller: 'AzureCreateContainerInstanceController',
        },
      },
    };

    var dashboard = {
      name: 'azure.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          templateUrl: './views/dashboard/dashboard.html',
          controller: 'AzureDashboardController',
        },
      },
    };

    $stateRegistryProvider.register(azure);
    $stateRegistryProvider.register(containerInstances);
    $stateRegistryProvider.register(containerInstanceCreation);
    $stateRegistryProvider.register(dashboard);
  },
]);
