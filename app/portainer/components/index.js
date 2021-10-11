import angular from 'angular';

import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';
import widgetModule from './widget';

import { ReactExampleAngular } from './ReactExample';

export default angular
  .module('portainer.app.components', [sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule, widgetModule])
  .component('reactExample', ReactExampleAngular).name;
