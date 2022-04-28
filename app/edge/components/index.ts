import angular from 'angular';

import { EdgeCheckinIntervalFieldAngular } from './EdgeCheckInIntervalField';
import { EdgeScriptFormAngular } from './EdgeScriptForm';

export const componentsModule = angular
  .module('app.edge.components', [])
  .component('edgeCheckinIntervalField', EdgeCheckinIntervalFieldAngular)
  .component('edgeScriptForm', EdgeScriptFormAngular).name;
