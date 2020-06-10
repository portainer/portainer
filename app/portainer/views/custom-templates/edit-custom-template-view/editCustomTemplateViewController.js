class EditCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, CustomTemplateService, Notifications) {
    this.formValues = null;

    this.$async = $async;
    this.$state = $state;
    this.CustomTemplateService = CustomTemplateService;
    this.Notifications = Notifications;

    this.getTemplate = this.getTemplate.bind(this);
    this.getTemplateAsync = this.getTemplateAsync.bind(this);
    this.submitAction = this.submitAction.bind(this);
    this.submitActionAsync = this.submitActionAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  getTemplate() {
    return this.$async(this.getTemplateAsync);
  }
  async getTemplateAsync() {
    try {
      const [template, file] = await Promise.all([
        this.CustomTemplateService.customTemplate(this.$state.params.id),
        this.CustomTemplateService.customTemplateFile(this.$state.params.id),
      ]);
      template.FileContent = file;
      this.formValues = template;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve custom template data');
    }
  }

  submitAction() {
    return this.$async(this.submitActionAsync);
  }
  async submitActionAsync() {
    this.actionInProgress = true;
    try {
      await this.CustomTemplateService.updateCustomTemplate(this.formValues.Id, this.formValues);
      this.Notifications.success('Custom template successfully updated');
      this.$state.go('portainer.templates.custom');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update custom template');
    } finally {
      this.actionInProgress = false;
    }
  }

  editorUpdate(cm) {
    this.formValues.fileContent = cm.getValue();
  }

  $onInit() {
    this.getTemplate();
  }
}

export default EditCustomTemplateViewController;
