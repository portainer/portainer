import angular from 'angular';

import { EdgeDevicesDatatableAngular } from "./components/EdgeDevicesDatatable/EdgeDevicesDatatableContainer";

export default angular
  .module('portainer.edge', [])
  .component('edgeDevicesDatatable', EdgeDevicesDatatableAngular).name;
