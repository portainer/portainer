angular.module('portainer.app').component('gitlabProjectsDatatable', {
  templateUrl: './gitlabProjectsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    state: '='
  }
});
