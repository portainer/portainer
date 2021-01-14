import angular from 'angular';

import { EdgeJobFormController } from './edgeJobFormController';

angular.module('portainer.edge').component('edgeJobForm', {
  templateUrl: './edgeJobForm.html',
  controller: EdgeJobFormController,
  bindings: {
    model: '=',
    groups: '<',
    tags: '<',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    isEditorDirty: '=',
  },
});
