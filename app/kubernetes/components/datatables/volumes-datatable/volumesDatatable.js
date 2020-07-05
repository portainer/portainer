angular.module('portainer.kubernetes').component('kubernetesVolumesDatatable', {
  templateUrl: './volumesDatatable.html',
  controller: 'KubernetesVolumesDatatableController',
  bindings: {
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
