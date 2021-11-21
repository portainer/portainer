angular.module('portainer.app').component('accessTokensDatatable', {
  templateUrl: './accessTokensDatatable.html',
  controller: 'AccessTokensDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
  },
});
