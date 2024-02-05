import { getInitialTemplateValues } from '@/react/edge/edge-stacks/CreateView/TemplateFieldset/TemplateFieldset';
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
    this.isGitTemplate = this.isGitTemplate.bind(this);
  }

  isGitTemplate() {
    return this.state.Method === 'template' && !!this.templateValues.template && !!this.templateValues.template.GitConfig;
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
    this.setTemplateValues(getInitialTemplateValues());
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
