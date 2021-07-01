export class EditEdgeStackFormController {
  /* @ngInject */
  constructor() {
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  editorUpdate(cm) {
    if (this.model.StackFileContent.replace(/(\r\n|\n|\r)/gm, '') !== cm.getValue().replace(/(\r\n|\n|\r)/gm, '')) {
      this.model.StackFileContent = cm.getValue();
      this.isEditorDirty = true;
    }
  }
}
