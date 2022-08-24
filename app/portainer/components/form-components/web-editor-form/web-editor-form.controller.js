class WebEditorFormController {
  /* @ngInject */
  constructor(BROWSER_OS_PLATFORM) {
    this.editorUpdate = this.editorUpdate.bind(this);
    this.BROWSER_OS_PLATFORM = BROWSER_OS_PLATFORM;
  }

  editorUpdate(cm) {
    this.onChange(cm.getValue());
  }
}

export default WebEditorFormController;
