angular.module('portainer.docker').component('nodesDatatable', {
  templateUrl: './nodesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showIpAddressColumn: '<',
    accessToNodeDetails: '<',
    refreshCallback: '<',
  },
});
