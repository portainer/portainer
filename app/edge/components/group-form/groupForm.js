angular.module('portainer.edge').component('edgeGroupForm', {
  templateUrl: './groupForm.html',
  controller: 'EdgeGroupFormController',
  bindings: {
    model: '<',
    groups: '<',
    tags: '<',
    formActionLabel: '@',
    formAction: '<',
    actionInProgress: '<',
    loaded: '<',
    pageType: '@',
  },
});
