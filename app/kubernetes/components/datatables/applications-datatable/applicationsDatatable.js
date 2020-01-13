angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatable', {
  templateUrl: './applicationsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<'
  }
});