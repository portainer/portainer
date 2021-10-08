import angular from 'angular';

angular.module('portainer.app').component('customTemplatesList', {
  templateUrl: './customTemplatesList.html',
  controller: 'CustomTemplatesListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    tableKey: '@',
    onSelectClick: '<',
    showSwarmStacks: '<',
    onDeleteClick: '<',
    isEditAllowed: '<',
    createPath: '@',
    editPath: '@',
  },
});
