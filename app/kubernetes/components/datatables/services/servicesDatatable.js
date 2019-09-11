angular.module('portainer.kubernetes').component('kubernetesServicesDatatable', {
  templateUrl: './servicesDatatable.html',
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
