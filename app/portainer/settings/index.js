import angular from 'angular';

import authenticationModule from './authentication';
import generalModule from './general';

import { SettingsFDOAngular } from './edge-compute/SettingsFDO';
import { SettingsOpenAMTAngular } from './edge-compute/SettingsOpenAMT';
import { EdgeComputeSettingsViewAngular } from './edge-compute/EdgeComputeSettingsView';

export default angular
  .module('portainer.settings', [authenticationModule, generalModule])
  .component('settingsEdgeCompute', EdgeComputeSettingsViewAngular)
  .component('settingsFdo', SettingsFDOAngular)
  .component('settingsOpenAmt', SettingsOpenAMTAngular).name;
