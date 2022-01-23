import angular from 'angular';

import { EdgeDevicesDatatableAngular } from '@/edge/devices/components/EdgeDevicesDatatable/EdgeDevicesDatatableContainer';

export default angular
  .module('portainer.edge.devices', [])
  .component('edgeDevicesDatatable', EdgeDevicesDatatableAngular).name;
