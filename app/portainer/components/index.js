import angular from 'angular';

import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';

import { ReactExampleAngular } from './ReactExample';
import { TooltipAngular } from './Tooltip';

export default angular
  .module('portainer.app.components', [sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('portainerTooltip', TooltipAngular)
  .component('reactExample', ReactExampleAngular).name;
