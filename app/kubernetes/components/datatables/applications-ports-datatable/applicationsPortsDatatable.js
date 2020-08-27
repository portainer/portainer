angular.module('portainer.kubernetes').component('kubernetesApplicationsPortsDatatable', {
  templateUrl: './applicationsPortsDatatable.html',
  controller: 'KubernetesApplicationsPortsDatatableController',
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
