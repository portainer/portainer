angular.module('portainer.docker').component('ngNetworksDatatable', {
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
    refreshCallback: '<',
  },
});
