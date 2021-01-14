export class EditEdgeStackFormController {
  /* @ngInject */
  constructor() {
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  editorUpdate(cm) {
    this.model.StackFileContent = cm.getValue();
    this.isEditorDirty = true;
  }
}
