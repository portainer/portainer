angular.module('portainer.docker').component('jobsDatatable', {
  templateUrl: 'app/docker/components/datatables/host-jobs-datatable/jobsDatatable.html',
  controller: 'JobsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});