angular.module('portainer.app').component('registriesRepositoryTagsDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-repository-tags-datatable/registriesRepositoryTagsDatatable.html',
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
