angular.module('portainer.docker').component('imagesDatatable', {
  templateUrl: 'app/docker/components/datatables/images-datatable/imagesDatatable.html',
  controller: 'ImagesDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<',
    forceRemoveAction: '<'
  }
});
