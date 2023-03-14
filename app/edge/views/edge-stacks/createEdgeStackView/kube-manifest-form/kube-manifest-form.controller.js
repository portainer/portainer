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
    this.onChangeUseManifestNamespaces = this.onChangeUseManifestNamespaces.bind(this);
  }

  onChangeFormValues(newValues) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...newValues,
      };
    });
  }

  onChangeUseManifestNamespaces(value) {
    this.onChangeFormValues({ UseManifestNamespaces: value });
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
    return this.$async(async () => {
      this.state.Method = method;
    });
  }
}

export default KubeManifestFormController;
