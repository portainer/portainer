angular.module('portainer.kubernetes').component('kubernetesNodeApplicationsDatatable', {
  templateUrl: './nodeApplicationsDatatable.html',
  controller: 'KubernetesNodeApplicationsDatatableController',
  bindings: {
    titleText: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<',
  },
});
