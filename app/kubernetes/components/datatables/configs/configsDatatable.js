angular.module('portainer.kubernetes').component('kubernetesConfigsDatatable', {
  templateUrl: './configsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<'
  }
});
