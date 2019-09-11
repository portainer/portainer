angular.module('portainer.kubernetes').component('kubernetesSecretsDatatable', {
  templateUrl: './secretsDatatable.html',
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
