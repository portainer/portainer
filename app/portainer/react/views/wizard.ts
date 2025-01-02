import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import {
  EnvironmentCreationView,
  EnvironmentTypeSelectView,
  HomeView,
} from '@/react/portainer/environments/wizard';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AccessHeaders } from '@/portainer/authorization-guard';

export const wizardModule = angular
  .module('portainer.app.react.views.wizard', [])
  .component(
    'wizardEnvironmentCreationView',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(EnvironmentCreationView))),
      []
    )
  )
  .component(
    'wizardEnvironmentTypeSelectView',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(EnvironmentTypeSelectView))),
      []
    )
  )
  .component(
    'wizardMainView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(HomeView))), [])
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
    data: {
      access: AccessHeaders.Admin,
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.wizard.endpoints',
    url: '/endpoints?referrer',
    views: {
      'content@': {
        component: 'wizardEnvironmentTypeSelectView',
      },
    },
    params: {
      localEndpointId: 0,
    },
    data: {
      docs: '/admin/environments/add',
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
