angular.module(
  'portainer.kubernetes'
).component(
  'kubernetesNodeApplicationsDatatable',
  {
    templateUrl: './nodeApplicationsDatatable.html',
    controller: 'GenericDatatableController',
    bindings: {
      titleText: '@',
      titleIcon: '@',
      dataset: '<',
      tableKey: '@',
      orderBy: '@',
      reverseOrder: '<',
      refreshCallback: '<'
    }
  }
);