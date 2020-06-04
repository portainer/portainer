angular.module('portainer.docker').component('containerNetworksDatatable', {
  templateUrl: './containerNetworksDatatable.html',
  controller: 'ContainerNetworksDatatableController',
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
    nodeName: '<',
  },
});
