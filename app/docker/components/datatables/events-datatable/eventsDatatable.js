angular.module('portainer.docker').component('eventsDatatable', {
  templateUrl: 'app/docker/components/datatables/events-datatable/eventsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
