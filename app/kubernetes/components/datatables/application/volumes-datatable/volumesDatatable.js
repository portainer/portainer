angular.module('portainer.kubernetes').component('kubernetesApplicationVolumesDatatable', {
  templateUrl: './volumesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<'
  }
});
