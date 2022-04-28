import angular from 'angular';
import controller from './access-tokens-datatable.controller';

angular.module('portainer.app').component('accessTokensDatatable', {
  templateUrl: './access-tokens-datatable.html',
  controller,
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    uiCanExit: '<',
  },
});
