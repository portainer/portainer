angular.module('portainer.agent').component('filesDatatable', {
  templateUrl: 'app/agent/components/files-datatable/files-datatable.html',
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
    rename: '&',
    download: '&',
    delete: '&'
  }
});
