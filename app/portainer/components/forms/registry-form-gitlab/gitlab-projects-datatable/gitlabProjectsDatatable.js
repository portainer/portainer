angular.module('portainer.app').component('gitlabProjectsDatatable', {
  templateUrl: './gitlabProjectsDatatable.html',
  controller: 'GitlabProjectsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    state: '=',
  },
});
