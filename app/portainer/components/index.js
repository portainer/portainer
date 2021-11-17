import angular from 'angular';

import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';
import widgetModule from './widget';

import { ReactExampleAngular } from './ReactExample';
import { TooltipAngular } from './Tooltip';
import { beFeatureIndicatorAngular } from './BEFeatureIndicator';

export default angular
  .module('portainer.app.components', [widgetModule, sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('portainerTooltip', TooltipAngular)
  .component('beFeatureIndicator', beFeatureIndicatorAngular)
  .component('reactExample', ReactExampleAngular).name;
