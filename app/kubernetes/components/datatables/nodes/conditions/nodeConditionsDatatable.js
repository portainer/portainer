angular.module('portainer.kubernetes').component('kubernetesNodeConditionsDatatable', {
  templateUrl: './nodeConditionsDatatable.html',
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
