angular.module('portainer.app').component('registriesImageTagsDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-image-tags-datatable/registriesImageTagsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    retagAction: '<'
  }
});
