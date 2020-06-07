angular.module('portainer.edge').component('edgeJobResultsDatatable', {
  templateUrl: './edgeJobResultsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    onDownloadLogsClick: '<',
    onCollectLogsClick: '<',
    onClearLogsClick: '<',
  },
});
