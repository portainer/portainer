angular.module('portainer.edge').component('edgeStacksDatatable', {
  templateUrl: './edgeStacksDatatable.html',
  controller: 'EdgeStacksDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<',
  },
});
