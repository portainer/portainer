import { editor, git, edgeStackTemplate, upload } from '@@/BoxSelector/common-options/build-methods';

class DockerComposeFormController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.methodOptions = [editor, upload, git, edgeStackTemplate];

    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
    this.onChangeFormValues = this.onChangeFormValues.bind(this);
  }

  onChangeFormValues(newValues) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...newValues,
      };
    });
  }

  onChangeMethod(method) {
    this.state.Method = method;
    this.formValues.StackFileContent = '';
  }

  onChangeFileContent(value) {
    return this.$async(async () => {
      this.formValues.StackFileContent = value;
      this.state.isEditorDirty = true;
    });
  }

  onChangeFile(value) {
    return this.$async(async () => {
      this.formValues.StackFile = value;
    });
  }
}

export default DockerComposeFormController;
