angular.module('portainer.docker').component('containersDatatableActions', {
  templateUrl: './containersDatatableActions.html',
  controller: 'ContainersDatatableActionsController',
  bindings: {
    selectedItems: '=',
    selectedItemCount: '=',
    noStoppedItemsSelected: '=',
    noRunningItemsSelected: '=',
    noPausedItemsSelected: '=',
    showAddAction: '<'
  }
});
