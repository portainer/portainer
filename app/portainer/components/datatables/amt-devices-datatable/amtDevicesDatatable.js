angular.module('portainer.docker').component('amtDevicesDatatable', {
  templateUrl: './amtDevicesDatatable.html',
  controller: 'AMTDevicesDatatableController',
  bindings: {
    endpointId: '<',
    devices: '<',
    error: '<',
  },
});
