angular.module('portainer.kubernetes').component('kubernetesIntegratedApplicationsDatatable', {
  templateUrl: './integratedApplicationsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<',
  },
});
