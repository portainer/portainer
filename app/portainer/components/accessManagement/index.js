import angular from 'angular';

import { porAccessManagement } from './por-access-management';
import { porAccessManagementUsersSelector } from './por-access-management-users-selector';

export default angular
  .module('portainer.app.component.access-management', [])
  .component('porAccessManagement', porAccessManagement)
  .component('porAccessManagementUsersSelector', porAccessManagementUsersSelector).name;
