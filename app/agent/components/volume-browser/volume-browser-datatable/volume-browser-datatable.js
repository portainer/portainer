angular.module('portainer.agent').component('volumeBrowserDatatable', {
  templateUrl: 'app/agent/components/volume-browser/volume-browser-datatable/volumeBrowserDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  },
  require: {
    volumeBrowser: '^^volumeBrowser'
  }
});
