angular.module('portainer.docker').component('registryImagesDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-images-datatable/registryImagesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<'
  }
});
