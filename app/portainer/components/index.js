import angular from 'angular';

import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';
import widgetModule from './widget';

import { ReactExampleAngular } from './ReactExample';
import boxSelectorModule from './BoxSelector';
import { TooltipAngular } from './Tooltip';

export default angular
  .module('portainer.app.components', [boxSelectorModule, widgetModule, sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('portainerTooltip', TooltipAngular)
  .component('reactExample', ReactExampleAngular).name;
