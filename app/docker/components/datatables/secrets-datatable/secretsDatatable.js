angular.module('portainer.docker').component('secretsDatatable', {
  templateUrl: './secretsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showOwnershipColumn: '<',
    removeAction: '<',
    refreshCallback: '<'
  }
});
