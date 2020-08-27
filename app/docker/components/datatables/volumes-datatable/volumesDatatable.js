angular.module('portainer.docker').component('volumesDatatable', {
  templateUrl: './volumesDatatable.html',
  controller: 'VolumesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showHostColumn: '<',
    removeAction: '<',
    showBrowseAction: '<',
    offlineMode: '<',
    refreshCallback: '<',
  },
});
