angular.module('portainer.kubernetes').component('kubernetesApplicationsStacksDatatable', {
  templateUrl: './applicationsStacksDatatable.html',
  controller: 'KubernetesApplicationsStacksDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<',
    removeAction: '<',
  },
});
