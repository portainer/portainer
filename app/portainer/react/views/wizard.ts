import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import {
  EnvironmentCreationView,
  EnvironmentTypeSelectView,
  HomeView,
} from '@/react/portainer/environments/wizard';

export const wizardModule = angular
  .module('portainer.app.react.views.wizard', [])
  .component('wizardEnvironmentCreationView', r2a(EnvironmentCreationView, []))
  .component(
    'wizardEnvironmentTypeSelectView',
    r2a(EnvironmentTypeSelectView, [])
  )
  .component('wizardMainView', r2a(HomeView, []))
  .config(config).name;

function config($stateRegistryProvider: StateRegistry) {
  $stateRegistryProvider.register({
    name: 'portainer.wizard',
    url: '/wizard',
    views: {
      'content@': {
        component: 'wizardMainView',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.wizard.endpoints.create',
    url: '/create?envType',
    views: {
      'content@': {
        component: 'wizardEnvironmentCreationView',
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
