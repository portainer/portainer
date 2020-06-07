import _ from 'lodash-es';

class CustomTemplatesViewController {
  /* @ngInject */
  constructor($async, Authentication, CustomTemplateService, Notifications) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.CustomTemplateService = CustomTemplateService;
    this.Notifications = Notifications;

    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplatesAsync = this.getTemplatesAsync.bind(this);
    this.removeTemplates = this.removeTemplates.bind(this);
    this.removeTemplatesAsync = this.removeTemplatesAsync.bind(this);
  }

  getTemplates() {
    return this.$async(this.getTemplatesAsync);
  }
  async getTemplatesAsync() {
    try {
      this.templates = await this.CustomTemplateService.customTemplates();
    } catch (err) {
      this.Notifications.error('Failed loading templates', err, 'Unable to load custom templates');
    }
  }

  removeTemplates(templates) {
    return this.$async(this.removeTemplatesAsync, templates);
  }
  async removeTemplatesAsync(templates) {
    for (let template of templates) {
      try {
        await this.CustomTemplateService.remove(template.id);
        this.Notifications.success('Removed template successfully');
        _.remove(this.templates, template);
      } catch (err) {
        this.Notifications.error('Failed removing template', err, 'Unable to remove custom template');
      }
    }
  }

  $onInit() {
    this.getTemplates();

    this.isAdmin = this.Authentication.isAdmin();
    const user = this.Authentication.getUserDetails();
    this.currentUserId = user.ID;
  }
}

export default CustomTemplatesViewController;
