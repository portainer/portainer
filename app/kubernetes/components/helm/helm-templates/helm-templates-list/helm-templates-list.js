import angular from 'angular';
import controller from './helm-templates-list.controller';

angular.module('portainer.kubernetes').component('helmTemplatesList', {
  templateUrl: './helm-templates-list.html',
  controller,
  bindings: {
    loading: '<',
    titleText: '@',
    titleIcon: '@',
    charts: '<',
    tableKey: '@',
    selectAction: '<',
  },
});
