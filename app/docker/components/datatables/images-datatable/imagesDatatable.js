angular.module('portainer.docker').component('imagesDatatable', {
  templateUrl: 'app/docker/components/datatables/images-datatable/imagesDatatable.html',
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
    forceRemoveAction: '<'
  }
});
