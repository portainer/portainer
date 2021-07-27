import angular from 'angular';

import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';

export default angular.module('portainer.app.components', [gitFormModule, porAccessManagementModule]).name;
