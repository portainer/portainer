angular.module('portainer.kubernetes').component('kubernetesNodesDatatable', {
  templateUrl: './nodesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<',
    isAdmin: '<',
    useServerMetrics: '<',
  },
});
