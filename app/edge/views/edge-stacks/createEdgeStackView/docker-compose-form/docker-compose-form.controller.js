import { editor, git, edgeStackTemplate, upload } from '@@/BoxSelector/common-options/build-methods';

class DockerComposeFormController {
  /* @ngInject */
  constructor($async, EdgeTemplateService, Notifications) {
    Object.assign(this, { $async, EdgeTemplateService, Notifications });

    this.methodOptions = [editor, upload, git, edgeStackTemplate];

    this.selectedTemplate = null;

    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangeTemplate = this.onChangeTemplate.bind(this);
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
    this.selectedTemplate = null;
  }

  onChangeTemplate(template) {
    return this.$async(async () => {
      this.formValues.StackFileContent = '';
      try {
        const fileContent = await this.EdgeTemplateService.edgeTemplate(template);
        this.formValues.StackFileContent = fileContent;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve Template');
      }
    });
  }

  onChangeFileContent(value) {
    this.formValues.StackFileContent = value;
    this.state.isEditorDirty = true;
  }

  onChangeFile(value) {
    return this.$async(async () => {
      this.formValues.StackFile = value;
    });
  }

  async $onInit() {
    return this.$async(async () => {
      try {
        const templates = await this.EdgeTemplateService.edgeTemplates();
        this.templates = templates.map((template) => ({ ...template, label: `${template.title} - ${template.description}` }));
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve Templates');
      }
    });
  }
}

export default DockerComposeFormController;
