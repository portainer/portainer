import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import { ListView } from '@/react/portainer/environments/update-schedules';

export const updateSchedulesModule = angular
  .module('portainer.edge.updateSchedules', [])
  .component('updateSchedulesListView', r2a(ListView, []))
  .config(config).name;

function config($stateRegistryProvider: StateRegistry) {
  $stateRegistryProvider.register({
    name: 'portainer.endpoints.updateSchedules',
    url: '/update-schedules',
    views: {
      'content@': {
        component: 'updateSchedulesListView',
      },
    },
  });
}
