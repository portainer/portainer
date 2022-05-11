angular.module('portainer.kubernetes').component('kubernetesResourcePoolsDatatable', {
  templateUrl: './resourcePoolsDatatable.html',
  controller: 'KubernetesResourcePoolsDatatableController',
  bindings: {
    endpoint: '<',
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<',
  },
});
