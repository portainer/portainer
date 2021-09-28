import angular from 'angular';

import { activityLogsView } from './activity-logs-view';
import { activityLogsDatatable } from './activity-logs-datatable';

export default angular
  .module('portainer.app.user-activity.activity-logs-view', [])
  .component('activityLogsDatatable', activityLogsDatatable)
  .component('activityLogsView', activityLogsView).name;
