import { Edit, GitHub, Upload } from 'react-feather';

class KubeManifestFormController {
  /* @ngInject */
  constructor($async) {
    Object.assign(this, { $async });

    this.methodOptions = [
      { id: 'method_editor', icon: Edit, featherIcon: true, label: 'Web editor', description: 'Use our Web editor', value: 'editor' },
      { id: 'method_upload', icon: Upload, featherIcon: true, label: 'Upload', description: 'Upload from your computer', value: 'upload' },
      { id: 'method_repository', icon: GitHub, featherIcon: true, label: 'Repository', description: 'Use a git repository', value: 'repository' },
    ];

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
