angular.module('portainer.kubernetes').component('kubernetesServicesDatatable', {
  templateUrl: './servicesDatatable.html',
  controller: 'KubernetesServicesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<'
  }
});
