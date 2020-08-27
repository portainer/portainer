angular.module('portainer.app').component('stacksDatatable', {
  templateUrl: './stacksDatatable.html',
  controller: 'StacksDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    offlineMode: '<',
    refreshCallback: '<',
    createEnabled: '<',
  },
});
