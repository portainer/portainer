import angular from 'angular';

import { activityLogsView } from './activity-logs-view';

export default angular.module('portainer.app.user-activity.activity-logs-view', []).component('activityLogsView', activityLogsView).name;
