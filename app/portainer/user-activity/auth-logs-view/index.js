import angular from 'angular';

import { authLogsView } from './auth-logs-view';

export default angular.module('portainer.app.user-activity.auth-logs-view', []).component('authLogsView', authLogsView).name;
