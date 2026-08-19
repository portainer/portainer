import angular from 'angular';

import { porAccessManagement } from './por-access-management';

export default angular.module('portainer.app.component.access-management', []).component('porAccessManagement', porAccessManagement).name;
