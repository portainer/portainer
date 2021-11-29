import angular from 'angular';

import { KVMControlAngular } from "@/portainer/views/endpoints/kvm/KVMControl";
import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';
import widgetModule from './widget';

import { ReactExampleAngular } from './ReactExample';
import { TooltipAngular } from './Tooltip';


export default angular
  .module('portainer.app.components', [widgetModule, sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('portainerTooltip', TooltipAngular)
  .component('reactExample', ReactExampleAngular)
    .component('kvmControl', KVMControlAngular).name;
