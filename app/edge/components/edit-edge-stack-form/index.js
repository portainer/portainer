import angular from 'angular';

import { EditEdgeStackFormController } from './editEdgeStackFormController';

angular.module('portainer.edge').component('editEdgeStackForm', {
  templateUrl: './editEdgeStackForm.html',
  controller: EditEdgeStackFormController,
  bindings: {
    model: '<',
    actionInProgress: '<',
    submitAction: '<',
    edgeGroups: '<',
    isEditorDirty: '=',
  },
});
