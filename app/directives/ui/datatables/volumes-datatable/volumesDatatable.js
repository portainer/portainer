angular.module('ui').component('volumesDatatable', {
  templateUrl: 'app/directives/ui/datatables/volumes-datatable/volumesDatatable.html',
  controller: 'VolumesDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<'
  }
});
