angular.module('portainer.kubernetes').component('kubernetesVolumeApplicationsDatatable', {
  templateUrl: './volumeApplicationsDatatable.html',
  controller: 'GenericDatatableController',
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