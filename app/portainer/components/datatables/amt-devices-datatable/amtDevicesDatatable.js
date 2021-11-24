angular.module('portainer.docker').component('amtDevicesDatatable', {
  templateUrl: './amtDevicesDatatable.html',
  controller: 'AMTDevicesDatatableController',
  bindings: {
    devices: '<',
    serviceId: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    agentProxy: '<',
    textFilter: '=',
    showTaskLogsButton: '<',
  },
});
