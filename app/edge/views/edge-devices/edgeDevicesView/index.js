import angular from 'angular';

import { EdgeDevicesViewController } from './edgeDevicesViewController';

angular.module('portainer.edge').component('edgeDevicesView', {
  templateUrl: './edgeDevicesView.html',
  controller: EdgeDevicesViewController,
});
