import angular from 'angular';

import { CreateAccessTokenAngular } from '../views/account/CreateAccessToken';
import { SettingsEdgeComputeAngular } from '../settings/edge-compute/SettingsEdgeCompute';
import { SettingsFDOAngular } from '../settings/edge-compute/SettingsFDO';

import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';
import widgetModule from './widget';
import boxSelectorModule from './BoxSelector';
import headerModule from './PageHeader';

import { ReactExampleAngular } from './ReactExample';
import { TooltipAngular } from './Tip/Tooltip';
import { beFeatureIndicatorAngular } from './BEFeatureIndicator';

export default angular
  .module('portainer.app.components', [headerModule, boxSelectorModule, widgetModule, sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('portainerTooltip', TooltipAngular)
  .component('reactExample', ReactExampleAngular)
  .component('beFeatureIndicator', beFeatureIndicatorAngular)
  .component('createAccessToken', CreateAccessTokenAngular)
    .component('settingsEdgeCompute', SettingsEdgeComputeAngular)
    .component('settingsFdo', SettingsFDOAngular)
    .name;
