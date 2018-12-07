angular.module('portainer.app').component('templateList', {
  templateUrl: 'app/portainer/components/template-list/templateList.html',
  controller: 'TemplateListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    tableKey: '@',
    selectAction: '<',
    deleteAction: '<',
    showSwarmStacks: '<',
    showAddAction: '<',
    showUpdateAction: '<',
    showDeleteAction: '<'
  }
});
