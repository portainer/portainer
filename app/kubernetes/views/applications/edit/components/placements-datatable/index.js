angular.module('portainer.kubernetes').component('kubernetesApplicationPlacementsDatatable', {
  templateUrl: './template.html',
  controller: 'KubernetesApplicationPlacementsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<',
    loading: '<',
    removeAction: '<',
  },
});
