angular.module('portainer.docker').component('containerProcessesDatatable', {
  templateUrl: './containerProcessesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '=',
    headerset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
  },
});
