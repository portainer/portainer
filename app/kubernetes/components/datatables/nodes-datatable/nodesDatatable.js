angular.module('portainer.kubernetes').component('kubernetesNodesDatatable', {
  templateUrl: './nodesDatatable.html',
  controller: 'KubernetesNodesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<'
  }
});
