angular.module('ui').component('imagesDatatable', {
  templateUrl: 'app/directives/ui/datatables/images-datatable/imagesDatatable.html',
  controller: 'GenericDatatableController',
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
