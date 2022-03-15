import angular from 'angular';

import { AzureSidebarAngular } from './AzureSidebar/AzureSidebar';
import { DashboardViewAngular } from './Dashboard/DashboardView';
import { containerInstancesModule } from './ContainerInstances';

angular
  .module('portainer.azure', ['portainer.app', containerInstancesModule])
  .config([
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
            var preEndpoint = EndpointProvider.endpoints();
            try {
              EndpointProvider.setEndpointID(endpoint.Id);
              EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
              EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
              await StateManager.updateEndpointState(endpoint, []);
            } catch (e) {
              Notifications.error('Failed loading environment', e);
              if (preEndpoint) {
                EndpointProvider.setEndpoints(preEndpoint);
              }
              if (preEndpoint.Id) {
                EndpointProvider.setEndpointID(preEndpoint.Id);
              }
              if (preEndpoint.PublicURL) {
                EndpointProvider.setEndpointPublicURL(preEndpoint.PublicURL);
              }
              if (preEndpoint.Status) {
                EndpointProvider.setOfflineModeFromStatus(preEndpoint.Status);
              }
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
            component: 'createContainerInstanceView',
          },
        },
      };

      var dashboard = {
        name: 'azure.dashboard',
        url: '/dashboard',
        views: {
          'content@': {
            component: 'dashboardView',
          },
        },
      };

      $stateRegistryProvider.register(azure);
      $stateRegistryProvider.register(containerInstances);
      $stateRegistryProvider.register(containerInstance);
      $stateRegistryProvider.register(containerInstanceCreation);
      $stateRegistryProvider.register(dashboard);
    },
  ])
  .component('azureSidebar', AzureSidebarAngular)
  .component('dashboardView', DashboardViewAngular);
