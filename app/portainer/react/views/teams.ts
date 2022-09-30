import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { ItemView, ListView } from '@/react/portainer/users/teams';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const teamsModule = angular
  .module('portainer.app.teams', [])
  .config(config)
  .component(
    'teamView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ItemView))), [])
  )
  .component(
    'teamsView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  ).name;

/* @ngInject */
function config($stateRegistryProvider: StateRegistry) {
  $stateRegistryProvider.register({
    name: 'portainer.teams',
    url: '/teams',
    views: {
      'content@': {
        component: 'teamsView',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.teams.team',
    url: '/:id',
    views: {
      'content@': {
        component: 'teamView',
      },
    },
  });
}
