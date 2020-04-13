angular.module('portainer.edge').component('associatedEndpointsDatatable', {
  templateUrl: './associatedEndpointsDatatable.html',
  controller: 'AssociatedEndpointsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    endpointManagement: '<',
    accessManagement: '<',
    removeAction: '<',
    retrievePage: '<',
  },
});
