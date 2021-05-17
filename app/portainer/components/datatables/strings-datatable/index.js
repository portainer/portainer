import angular from 'angular';
// import controller from './strings-datatable.controller.js';

export const stringsDatatable = {
  templateUrl: './strings-datatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    emptyDatasetMessage: '@',

    columnHeader: '@',
    tableKey: '@',

    onRemove: '<',
  },
};

angular.module('portainer.app').component('stringsDatatable', stringsDatatable);
