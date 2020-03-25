angular.module('portainer.kubernetes').component('kubernetesApplicationConfigurationsDatatable', {
  templateUrl: './configurationsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<',
    removeAction: '<'
  }
});
