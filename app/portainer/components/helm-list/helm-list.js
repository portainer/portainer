angular.module('portainer.app').component('helmList', {
  templateUrl: './helm-list.html',
  controller: 'HelmListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    tableKey: '@',
    selectAction: '<',
  },
});
