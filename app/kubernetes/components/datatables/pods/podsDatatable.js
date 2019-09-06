angular.module('portainer.kubernetes').component('kubernetesPodsDatatable', {
  templateUrl: './podsDatatable.html',
  controller: 'KubernetesPodsDatatableController',
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
