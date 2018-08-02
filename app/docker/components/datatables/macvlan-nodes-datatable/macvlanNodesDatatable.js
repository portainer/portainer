angular.module('portainer.docker').component('macvlanNodesDatatable', {
  templateUrl: 'app/docker/components/datatables/macvlan-nodes-datatable/macvlanNodesDatatable.html',
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
    state: '='
  }
});
