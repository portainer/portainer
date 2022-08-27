import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import {
  EnvironmentCreationView,
  EnvironmentTypeSelectView,
  HomeView,
} from '@/react/portainer/environments/wizard';
import { withCurrentUser } from '@/portainer/hooks/useUser';
import { withReactQuery } from '@/react-tools/withReactQuery';

export const wizardModule = angular
  .module('portainer.app.react.views.wizard', [])
  .component(
    'wizardEnvironmentCreationView',
    r2a(withReactQuery(withCurrentUser(EnvironmentCreationView)), [])
  )
  .component(
    'wizardEnvironmentTypeSelectView',
    r2a(withReactQuery(withCurrentUser(EnvironmentTypeSelectView)), [])
  )
  .component(
    'wizardMainView',
    r2a(withReactQuery(withCurrentUser(HomeView)), [])
  )
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
    name: 'portainer.wizard.endpoints',
    url: '/endpoints?edgeDevice',
    views: {
      'content@': {
        component: 'wizardEnvironmentTypeSelectView',
      },
    },
    params: {
      localEndpointId: 0,
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
}
