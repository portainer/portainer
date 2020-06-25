export default class EditEdgeStackFormController {
  constructor() {
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  editorUpdate(cm) {
    this.model.StackFileContent = cm.getValue();
  }
}
