angular.module('portainer.docker').component('volumesDatatable', {
  templateUrl: 'app/docker/components/datatables/volumes-datatable/volumesDatatable.html',
  controller: 'VolumesDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<'
  }
});
