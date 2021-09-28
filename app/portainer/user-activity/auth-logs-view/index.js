import angular from 'angular';

import { authLogsView } from './auth-logs-view';
import { authLogsDatatable } from './auth-logs-datatable';

export default angular.module('portainer.app.user-activity.auth-logs-view', []).component('authLogsView', authLogsView).component('authLogsDatatable', authLogsDatatable).name;
