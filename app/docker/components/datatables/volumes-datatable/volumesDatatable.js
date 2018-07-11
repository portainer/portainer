angular.module('portainer.docker').component('volumesDatatable', {
  templateUrl: 'app/docker/components/datatables/volumes-datatable/volumesDatatable.html',
  controller: 'VolumesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showOwnershipColumn: '<',
    showHostColumn: '<',
    removeAction: '<'
  }
});
