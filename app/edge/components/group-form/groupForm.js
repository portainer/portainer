angular.module('portainer.edge').component('edgeGroupForm', {
  templateUrl: './groupForm.html',
  bindings: {
    model: '<',
    endpoints: '<',
    groups: '<',
    tags: '<',
    formActionLabel: '@',
    formAction: '<',
    actionInProgress: '<',
  }
});
