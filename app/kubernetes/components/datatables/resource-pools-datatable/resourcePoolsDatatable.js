angular.module('portainer.kubernetes').component('kubernetesResourcePoolsDatatable', {
  templateUrl: './resourcePoolsDatatable.html',
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