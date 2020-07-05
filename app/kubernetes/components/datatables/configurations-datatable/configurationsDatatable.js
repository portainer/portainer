angular.module('portainer.kubernetes').component('kubernetesConfigurationsDatatable', {
  templateUrl: './configurationsDatatable.html',
  controller: 'KubernetesConfigurationsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<',
    removeAction: '<',
  },
});
