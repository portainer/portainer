angular.module('portainer.docker').component('jobsDatatable', {
  templateUrl: './jobsDatatable.html',
  controller: 'JobsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});