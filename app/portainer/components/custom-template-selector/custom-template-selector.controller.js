class CustomTemplateSelectorController {
  /* @ngInject */
  constructor($async, CustomTemplateService, Notifications) {
    Object.assign(this, { $async, CustomTemplateService, Notifications });

    this.selectedTemplate = null;
    this.templates = null;
  }

  async handleChangeTemplate(templateId) {
    this.selectedTemplate = this.templates.find((t) => t.Id === templateId);
    this.onChange(templateId, this.selectedTemplate);
  }

  $onChanges({ value }) {
    if (value && value.currentValue && this.templates) {
      this.handleChangeTemplate(value.currentValue);
    }
  }

  $onInit() {
    return this.$async(async () => {
      try {
        const templates = await this.CustomTemplateService.customTemplates(this.stackType);
        this.templates = templates.map((template) => ({ ...template, label: `${template.Title} - ${template.Description}` }));
        if (this.value) {
          this.handleChangeTemplate(this.value);
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve Custom Templates');
      }
    });
  }
}

export default CustomTemplateSelectorController;
