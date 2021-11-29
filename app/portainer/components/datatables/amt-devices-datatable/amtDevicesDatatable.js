angular.module('portainer.docker').component('amtDevicesDatatable', {
  templateUrl: './amtDevicesDatatable.html',
  controller: 'AMTDevicesDatatableController',
  bindings: {
    devices: '<',
    error: '<',
  },
});
