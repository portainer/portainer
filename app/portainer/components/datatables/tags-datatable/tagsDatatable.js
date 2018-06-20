angular.module('portainer.app').component('tagsDatatable', {
  templateUrl: 'app/portainer/components/datatables/tags-datatable/tagsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<'
  }
});
