import './applicationsDatatable.css';

angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatable', {
  templateUrl: './applicationsDatatable.html',
  controller: 'KubernetesApplicationsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<',
    onPublishingModeClick: '<',
    isPrimary: '<',
  },
});
