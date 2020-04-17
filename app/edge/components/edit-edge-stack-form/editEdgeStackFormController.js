import angular from 'angular';

class EditEdgeStackFormController {
  constructor() {
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  editorUpdate(cm) {
    this.model.StackFileContent = cm.getValue();
  }
}

angular.module('portainer.edge').controller('EditEdgeStackFormController', EditEdgeStackFormController);
export default EditEdgeStackFormController;
