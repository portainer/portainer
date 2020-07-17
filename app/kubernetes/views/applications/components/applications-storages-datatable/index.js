angular.module('portainer.kubernetes').component('kubernetesApplicationsStoragesDatatable', {
  templateUrl: './template.html',
  controller: 'KubernetesApplicationsStoragesDatatableController',
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
