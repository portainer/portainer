angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatable2', {
  templateUrl: './applicationsDatatable2.html',
  controller: 'KubernetesApplicationsDatatableController2',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<',
    onPublishingModeClick: '<'
  }
});