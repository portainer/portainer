angular.module('portainer.kubernetes').component('kubernetesContainersDatatable', {
  templateUrl: './containersDatatable.html',
  controller: 'KubernetesContainersDatatableController',
  bindings: {
    dataset: '<',
    podId: '<',
    tableKey: '@',
    orderBy: '@',
    textFilter: '='
  }
});
