angular.module('portainer.agent').component('filesDatatable', {
  templateUrl: './files-datatable.html',
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
    onFileSelectedForUpload: '<'
  }
});
