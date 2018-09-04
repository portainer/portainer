angular.module('portainer.docker').component('containerNetworksDatatable', {
  templateUrl: 'app/docker/components/datatables/container-networks-datatable/containerNetworksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    container: '<',
    availableNetworks: '<',
    joinNetworkAction: '<',
    joinNetworkActionInProgress: '<',
    leaveNetworkActionInProgress: '<',
    leaveNetworkAction: '<',
    nodeName: '<'
  }
});
