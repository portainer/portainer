angular.module('ui').component('containerNetworksDatatable', {
  templateUrl: 'app/directives/ui/datatables/container-networks-datatable/containerNetworksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    container: '<',
    availableNetworks: '<',
    joinNetworkAction: '<',
    joinNetworkActionInProgress: '<',
    leaveNetworkActionInProgress: '<',
    leaveNetworkAction: '<'
  }
});
