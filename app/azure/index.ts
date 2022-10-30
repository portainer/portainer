import angular from 'angular';
import { StateRegistry, StateService } from '@uirouter/angularjs';

import { Environment } from '@/react/portainer/environments/types';
import { notifyError } from '@/portainer/services/notifications';
import { EndpointProvider, StateManager } from '@/portainer/services/types';

import { reactModule } from './react';

export const azureModule = angular
  .module('portainer.azure', [reactModule])
  .config(config).name;

/* @ngInject */
function config($stateRegistryProvider: StateRegistry) {
  const azure = {
    name: 'azure',
    url: '/azure',
    parent: 'endpoint',
    abstract: true,
    onEnter: /* @ngInject */ function onEnter(
      $async: (fn: () => Promise<void>) => Promise<void>,
      $state: StateService,
      endpoint: Environment,
      EndpointProvider: EndpointProvider,
      StateManager: StateManager
    ) {
      return $async(async () => {
        if (endpoint.Type !== 3) {
          $state.go('portainer.home');
          return;
        }
        try {
          EndpointProvider.setEndpointID(endpoint.Id);
          EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
          EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
          await StateManager.updateEndpointState(endpoint);
        } catch (e) {
          notifyError('Failed loading environment', e as Error);
          $state.go('portainer.home', {}, { reload: true });
        }
      });
    },
  };

  const containerInstances = {
    name: 'azure.containerinstances',
    url: '/containerinstances',
    views: {
      'content@': {
        component: 'containerInstancesView',
      },
    },
  };

  const containerInstance = {
    name: 'azure.containerinstances.container',
    url: '/:id',
    views: {
      'content@': {
        component: 'containerInstanceView',
      },
    },
  };

  const containerInstanceCreation = {
    name: 'azure.containerinstances.new',
    url: '/new/',
    views: {
      'content@': {
        component: 'createContainerInstanceView',
      },
    },
  };

  const dashboard = {
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
}
