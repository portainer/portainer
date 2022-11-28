angular.module('portainer.kubernetes').component('kubernetesEventsDatatable', {
  templateUrl: './eventsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    loading: '<',
    refreshCallback: '<',
  },
});
