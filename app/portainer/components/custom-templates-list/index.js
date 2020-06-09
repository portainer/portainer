import angular from 'angular';

angular.module('portainer.app').component('customTemplatesList', {
  templateUrl: './customTemplatesList.html',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    tableKey: '@',
    selectAction: '<',
    showSwarmStacks: '<',
  },
});
