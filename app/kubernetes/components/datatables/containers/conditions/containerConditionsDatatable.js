angular.module('portainer.kubernetes').component('kubernetesContainerConditionsDatatable', {
  templateUrl: './containerConditionsDatatable.html',
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
