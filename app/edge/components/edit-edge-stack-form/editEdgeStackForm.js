angular.module('portainer.edge').component('editEdgeStackForm', {
  templateUrl: './editEdgeStackForm.html',
  controller: 'EditEdgeStackFormController',
  bindings: {
    model: '<',
    actionInProgress: '<',
    submitAction: '<',
    edgeGroups: '<',
  },
});
