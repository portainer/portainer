import _ from 'lodash-es';

export default class KubeCustomTemplatesViewController {
  /* @ngInject */
  constructor($async, $state, Authentication, CustomTemplateService, FormValidator, ModalService, Notifications) {
    Object.assign(this, { $async, $state, Authentication, CustomTemplateService, FormValidator, ModalService, Notifications });

    this.state = {
      selectedTemplate: null,
      formValidationError: '',
      actionInProgress: false,
    };

    this.currentUser = {
      isAdmin: false,
      id: null,
    };

    this.isEditAllowed = this.isEditAllowed.bind(this);
    this.getTemplates = this.getTemplates.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.selectTemplate = this.selectTemplate.bind(this);
  }

  selectTemplate(template) {
    this.$state.go('kubernetes.deploy', { templateId: template.Id });
  }

  isEditAllowed(template) {
    // todo - check if current user is admin/endpointadmin/owner
    return this.currentUser.isAdmin || this.currentUser.id === template.CreatedByUserId;
  }

  getTemplates() {
    return this.$async(async () => {
      try {
        this.templates = await this.CustomTemplateService.customTemplates(3);
      } catch (err) {
        this.Notifications.error('Failed loading templates', err, 'Unable to load custom templates');
      }
    });
  }

  validateForm(accessControlData, isAdmin) {
    this.state.formValidationError = '';
    const error = this.FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      this.state.formValidationError = error;
      return false;
    }
    return true;
  }

  confirmDelete(templateId) {
    return this.$async(async () => {
      const confirmed = await this.ModalService.confirmDeletionAsync('Are you sure that you want to delete this template?');
      if (!confirmed) {
        return;
      }

      try {
        var template = _.find(this.templates, { Id: templateId });
        await this.CustomTemplateService.remove(templateId);
        this.Notifications.success('Template successfully deleted', template && template.Title);
        _.remove(this.templates, { Id: templateId });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed to delete template');
      }
    });
  }

  $onInit() {
    this.getTemplates();

    this.currentUser.isAdmin = this.Authentication.isAdmin();
    const user = this.Authentication.getUserDetails();
    this.currentUser.id = user.ID;
  }
}
