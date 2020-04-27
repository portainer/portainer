angular.module('portainer.app').component('templateList', {
  templateUrl: './templateList.html',
  controller: 'TemplateListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    tableKey: '@',
    selectAction: '<',
    showSwarmStacks: '<',
  },
});
