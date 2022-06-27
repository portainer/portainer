import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { ItemView, ListView } from '@/react/portainer/users/teams';
import { r2a } from '@/react-tools/react2angular';

export const teamsModule = angular
  .module('portainer.app.teams', [])
  .config(config)
  .component('teamView', r2a(ItemView, []))
  .component('teamsView', r2a(ListView, [])).name;

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
