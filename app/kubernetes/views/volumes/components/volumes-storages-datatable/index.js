angular.module('portainer.kubernetes').component('kubernetesVolumesStoragesDatatable', {
  templateUrl: './template.html',
  controller: 'KubernetesVolumesStoragesDatatableController',
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
