angular.module('ui').component('imagesDatatable', {
  templateUrl: 'app/directives/ui/datatables/images-datatable/imagesDatatable.html',
  controller: 'ImagesDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<',
    forceRemoveAction: '<'
  }
});
