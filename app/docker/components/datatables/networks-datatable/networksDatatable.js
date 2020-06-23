angular.module('portainer.docker').component('networksDatatable', {
  templateUrl: './networksDatatable.html',
  controller: 'NetworksDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showHostColumn: '<',
    removeAction: '<',
    offlineMode: '<',
    refreshCallback: '<',
  },
});
