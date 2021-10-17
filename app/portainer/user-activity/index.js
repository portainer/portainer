import angular from 'angular';

import authLogsViewModule from './auth-logs-view';
import activityLogsViewModule from './activity-logs-view';

export default angular.module('portainer.app.user-activity', [authLogsViewModule, activityLogsViewModule]).config(config).name;

/* @ngInject */
function config($stateRegistryProvider) {
  $stateRegistryProvider.register({
    name: 'portainer.authLogs',
    url: '/auth-logs',
    views: {
      'content@': {
        component: 'authLogsView',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'portainer.activityLogs',
    url: '/activity-logs',
    views: {
      'content@': {
        component: 'activityLogsView',
      },
    },
  });
}
