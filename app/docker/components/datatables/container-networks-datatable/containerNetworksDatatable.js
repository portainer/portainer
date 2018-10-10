angular.module('portainer.docker').component('containerNetworksDatatable', {
  templateUrl: './containerNetworksDatatable.html',
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
