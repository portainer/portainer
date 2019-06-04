angular.module('portainer.app').component('accessViewerDatatable', {
  templateUrl: './accessViewerDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    dataset: '<'
  }
});
