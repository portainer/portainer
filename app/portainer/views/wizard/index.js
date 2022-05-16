import angular from 'angular';
import { environmentCreationViewModule } from './EnvironmentsCreationView';
import { EnvironmentTypeSelectViewAngular } from './EnvironmentTypeSelectView';
import controller from './wizard-view.controller.js';

export const wizardModule = angular
  .module('portainer.app.wizard', [environmentCreationViewModule])
  .component('wizardView', {
    templateUrl: './wizard-view.html',
    controller,
  })
  .component('wizardEnvironmentTypeSelectView', EnvironmentTypeSelectViewAngular)
  .config(config).name;

function config($stateRegistryProvider) {
  $stateRegistryProvider.register({
    name: 'portainer.wizard',
    url: '/wizard',
    views: {
      'content@': {
        component: 'wizardView',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.wizard.endpoints.create',
    url: '/create?envType',
    views: {
      'content@': {
        component: 'wizardEndpoints',
      },
    },
    params: {
      envType: '',
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.wizard.endpoints',
    url: '/endpoints',
    views: {
      'content@': {
        component: 'wizardEnvironmentTypeSelectView',
      },
    },
    params: {
      localEndpointId: 0,
    },
  });
}
