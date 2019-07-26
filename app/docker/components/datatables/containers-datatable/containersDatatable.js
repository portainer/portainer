angular.module('portainer.docker').component('containersDatatable', {
  templateUrl: './containersDatatable.html',
  controller: 'ContainersDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showOwnershipColumn: '<',
    showHostColumn: '<',
    showAddAction: '<',
    offlineMode: '<',
    refreshCallback: '<'
  }
});
