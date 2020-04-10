angular.module('portainer.docker').component('macvlanNodesDatatable', {
  templateUrl: './macvlanNodesDatatable.html',
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
    state: '=',
  },
});
