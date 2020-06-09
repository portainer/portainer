import angular from 'angular';
import EdgeJobResultsDatatableController from './edgeJobResultsDatatableController';

angular.module('portainer.edge').component('edgeJobResultsDatatable', {
  templateUrl: './edgeJobResultsDatatable.html',
  controller: EdgeJobResultsDatatableController,
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
    refreshCallback: '<',
  },
});
