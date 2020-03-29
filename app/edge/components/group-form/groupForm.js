angular.module('portainer.edge').component('edgeGroupForm', {
  templateUrl: './groupForm.html',
  bindings: {
    model: '<' /* {Name: String, Endpoints: endpointID[], Tags: String[] */,
    endpoints: '<',
    groups: '<',
    tags: '<',
    formActionLabel: '@',
    formAction: '<',
    actionInProgress: '<',
    onChangeTags: '<'
  }
});
