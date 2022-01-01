angular.module('portainer.kubernetes').component('kubernetesContainersDatatable', {
  templateUrl: './containersDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<',
    isPod: '<',
    useServerMetrics: '<',
  },
});
