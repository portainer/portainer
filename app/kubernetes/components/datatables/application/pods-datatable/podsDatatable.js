angular.module('portainer.kubernetes').component('kubernetesPodsDatatable', {
  templateUrl: './podsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    refreshCallback: '<',
  },
});
