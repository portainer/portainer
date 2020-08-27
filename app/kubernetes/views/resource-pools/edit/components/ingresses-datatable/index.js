angular.module('portainer.kubernetes').component('kubernetesResourcePoolIngressesDatatable', {
  templateUrl: './template.html',
  controller: 'KubernetesResourcePoolIngressesDatatableController',
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
