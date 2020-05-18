import EdgeJobFormController from './edgeJobFormController';

angular.module('portainer.edge').component('edgeJobForm', {
  templateUrl: './edgeJobForm.html',
  controller: EdgeJobFormController,
  bindings: {
    model: '=',
    endpoints: '<',
    groups: '<',
    tags: '<',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
