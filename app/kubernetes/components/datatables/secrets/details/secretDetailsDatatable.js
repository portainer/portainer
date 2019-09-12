angular.module('portainer.kubernetes').component('kubernetesSecretDetailsDatatable', {
  templateUrl: './secretDetailsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    loading: '<'
  }
});
