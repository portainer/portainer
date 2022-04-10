import angular from 'angular';

import authenticationModule from './authentication';
import generalModule from './general';

import { SettingsFDOAngular } from './edge-compute/SettingsFDO';
import { SettingsOpenAMTAngular } from './edge-compute/SettingsOpenAMT';
import { EdgeComputeSettingsViewAngular } from './edge-compute/EdgeComputeSettingsView';
import { EdgeScriptFormAngular } from './edge-compute/AutomaticEdgeEnvCreation/EdgeScriptForm';

export default angular
  .module('portainer.settings', [authenticationModule, generalModule])
  .component('settingsEdgeCompute', EdgeComputeSettingsViewAngular)
  .component('settingsFdo', SettingsFDOAngular)
  .component('settingsOpenAmt', SettingsOpenAMTAngular)
  .component('edgeScriptForm', EdgeScriptFormAngular).name;
