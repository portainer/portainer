import angular from 'angular';

import { EdgeScriptFormAngular } from './EdgeScriptForm';

export const componentsModule = angular
  .module('app.edge.components', [])
  .component('edgeScriptForm', EdgeScriptFormAngular).name;
