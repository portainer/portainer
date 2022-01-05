import angular from 'angular';

import authenticationModule from './authentication';
import generalModule from './general';

import { SettingsEdgeComputeAngular } from './edge-compute/SettingsEdgeCompute';
import { SettingsFDOAngular } from './edge-compute/SettingsFDO';
import { SettingsOpenAMTAngular } from './edge-compute/SettingsOpenAMT';

export default angular
  .module('portainer.settings', [authenticationModule, generalModule])
  .component('settingsEdgeCompute', SettingsEdgeComputeAngular)
  .component('settingsFdo', SettingsFDOAngular)
  .component('settingsOpenAmt', SettingsOpenAMTAngular).name;
