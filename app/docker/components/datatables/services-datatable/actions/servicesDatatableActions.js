angular.module('portainer.docker').component('servicesDatatableActions', {
  templateUrl: './servicesDatatableActions.html',
  controller: 'ServicesDatatableActionsController',
  bindings: {
    selectedItems: '=',
    selectedItemCount: '=',
    showUpdateAction: '<',
    showAddAction: '<',
    endpointId: '<',
  },
});
