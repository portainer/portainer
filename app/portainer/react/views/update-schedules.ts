import angular from 'angular';
import { StateRegistry } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import {
  ListView,
  CreateView,
  ItemView,
} from '@/react/portainer/environments/update-schedules';

export const updateSchedulesModule = angular
  .module('portainer.edge.updateSchedules', [])
  .component('updateSchedulesListView', r2a(ListView, []))
  .component('updateSchedulesCreateView', r2a(CreateView, []))
  .component('updateSchedulesItemView', r2a(ItemView, []))
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

  $stateRegistryProvider.register({
    name: 'portainer.endpoints.updateSchedules.create',
    url: '/update-schedules/new',
    views: {
      'content@': {
        component: 'updateSchedulesCreateView',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.endpoints.updateSchedules.item',
    url: '/update-schedules/:id',
    views: {
      'content@': {
        component: 'updateSchedulesItemView',
      },
    },
  });
}
