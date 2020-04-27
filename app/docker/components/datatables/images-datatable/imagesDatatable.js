angular.module('portainer.docker').component('imagesDatatable', {
  templateUrl: './imagesDatatable.html',
  controller: 'ImagesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showHostColumn: '<',
    removeAction: '<',
    downloadAction: '<',
    forceRemoveAction: '<',
    exportInProgress: '<',
    offlineMode: '<',
    refreshCallback: '<',
  },
});
