angular.module('portainer.docker').component('servicesDatatableActions', {
  templateUrl: 'app/docker/components/datatables/services-datatable/actions/servicesDatatableActions.html',
  controller: 'ServicesDatatableActionsController',
  bindings: {
    selectedItems: '=',
    selectedItemCount: '=',
    showUpdateAction: '<',
    showAddAction: '<'
  }
});
