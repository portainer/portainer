import { editor, git, upload } from '@@/BoxSelector/common-options/build-methods';

class KubeManifestFormController {
  /* @ngInject */
  constructor($async) {
    Object.assign(this, { $async });

    this.methodOptions = [editor, upload, git];

    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeFormValues = this.onChangeFormValues.bind(this);
    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
  }

  onChangeFormValues(values) {
    this.formValues = values;
  }

  onChangeFileContent(value) {
    this.state.isEditorDirty = true;
    this.formValues.StackFileContent = value;
  }

  onChangeFile(value) {
    return this.$async(async () => {
      this.formValues.StackFile = value;
    });
  }

  onChangeMethod(method) {
    this.state.Method = method;
  }
}

export default KubeManifestFormController;
