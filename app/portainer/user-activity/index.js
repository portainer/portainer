import angular from 'angular';

import authLogsViewModule from './auth-logs-view';

import { UserActivity } from './user-activity.rest';
import { UserActivityService } from './user-activity.service';

export default angular
  .module('portainer.app.user-activity', [authLogsViewModule])
  .service('UserActivity', UserActivity)
  .service('UserActivityService', UserActivityService)
  .config(config).name;

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
}
