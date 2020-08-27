angular.module('portainer.kubernetes').component('kubernetesEventsDatatable', {
  templateUrl: './eventsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    loading: '<',
    refreshCallback: '<',
  },
});
