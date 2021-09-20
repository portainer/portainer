angular.module('portainer.azure', ['portainer.app']).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    var azure = {
      name: 'azure',
      url: '/azure',
      parent: 'endpoint',
      abstract: true,
      onEnter: /* @ngInject */ function onEnter($async, $state, endpoint, EndpointProvider, Notifications, StateManager) {
        return $async(async () => {
          if (endpoint.Type !== 3) {
            $state.go('portainer.home');
            return;
          }
          try {
            EndpointProvider.setEndpointID(endpoint.Id);
            EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
            EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
            await StateManager.updateEndpointState(endpoint, []);
          } catch (e) {
            Notifications.error('Failed loading environment', e);
            $state.go('portainer.home', {}, { reload: true });
          }
        });
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

    var containerInstance = {
      name: 'azure.containerinstances.container',
      url: '/:id',
      views: {
        'content@': {
          component: 'containerInstanceDetails',
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
    $stateRegistryProvider.register(containerInstance);
    $stateRegistryProvider.register(containerInstanceCreation);
    $stateRegistryProvider.register(dashboard);
  },
]);
