import angular from 'angular';

angular.module('portainer.agent').component('filesDatatable', {
  templateUrl: './filesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',

    isRoot: '<',
    goToParent: '&',
    browse: '&',
    rename: '&',
    download: '&',
    delete: '&',

    isUploadAllowed: '<',
    onFileSelectedForUpload: '<',
  },
});
