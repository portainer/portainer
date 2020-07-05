angular.module('portainer.kubernetes').component('kubernetesResourcePoolApplicationsDatatable', {
  templateUrl: './resourcePoolApplicationsDatatable.html',
  controller: 'KubernetesResourcePoolApplicationsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<',
  },
});
