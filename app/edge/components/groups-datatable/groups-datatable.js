angular.module('portainer.edge').component('edgeGroupsDatatable', {
  templateUrl: './groups-datatable.html',
  controller: 'EdgeGroupsDatatableController',
  bindings: {
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    updateAction: '<',
    reverseOrder: '<'
  }
});
