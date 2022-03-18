import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';
import { AccessControlFormData } from '@/portainer/components/accessControlForm/porAccessControlFormModel';

class KubeEditCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService) {
    Object.assign(this, { $async, $state, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService });

    this.formValues = null;
    this.state = {
      formValidationError: '',
      isEditorDirty: false,
    };
    this.templates = [];

    this.getTemplate = this.getTemplate.bind(this);
    this.submitAction = this.submitAction.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onBeforeUnload = this.onBeforeUnload.bind(this);
  }

  getTemplate() {
    return this.$async(async () => {
      try {
        const { id } = this.$state.params;

        const [template, file] = await Promise.all([this.CustomTemplateService.customTemplate(id), this.CustomTemplateService.customTemplateFile(id)]);
        template.FileContent = file;
        this.formValues = template;
        this.oldFileContent = this.formValues.FileContent;

        this.formValues.ResourceControl = new ResourceControlViewModel(template.ResourceControl);
        this.formValues.AccessControlData = new AccessControlFormData();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve custom template data');
      }
    });
  }

  validateForm() {
    this.state.formValidationError = '';

    if (!this.formValues.FileContent) {
      this.state.formValidationError = 'Template file content must not be empty';
      return false;
    }

    const title = this.formValues.Title;
    const id = this.$state.params.id;

    const isNotUnique = this.templates.some((template) => template.Title === title && template.Id != id);
    if (isNotUnique) {
      this.state.formValidationError = `A template with the name ${title} already exists`;
      return false;
    }

    const isAdmin = this.Authentication.isAdmin();
    const accessControlData = this.formValues.AccessControlData;
    const error = this.FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      this.state.formValidationError = error;
      return false;
    }

    return true;
  }

  submitAction() {
    return this.$async(async () => {
      if (!this.validateForm()) {
        return;
      }

      this.actionInProgress = true;
      try {
        await this.CustomTemplateService.updateCustomTemplate(this.formValues.Id, this.formValues);

        const userDetails = this.Authentication.getUserDetails();
        const userId = userDetails.ID;
        await this.ResourceControlService.applyResourceControl(userId, this.formValues.AccessControlData, this.formValues.ResourceControl);

        this.Notifications.success('Custom template successfully updated');
        this.state.isEditorDirty = false;
        this.$state.go('kubernetes.templates.custom');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update custom template');
      } finally {
        this.actionInProgress = false;
      }
    });
  }

  onChangeFileContent(value) {
    if (stripSpaces(this.formValues.FileContent) !== stripSpaces(value)) {
      this.formValues.FileContent = value;
      this.state.isEditorDirty = true;
    }
  }

  async $onInit() {
    this.$async(async () => {
      this.getTemplate();

      try {
        this.templates = await this.CustomTemplateService.customTemplates();
      } catch (err) {
        this.Notifications.error('Failure loading', err, 'Failed loading custom templates');
      }

      window.addEventListener('beforeunload', this.onBeforeUnload);
    });
  }

  isEditorDirty() {
    return this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty;
  }

  uiCanExit() {
    if (this.isEditorDirty()) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }

  onBeforeUnload(event) {
    if (this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty) {
      event.preventDefault();
      event.returnValue = '';

      return '';
    }
  }

  $onDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }
}

export default KubeEditCustomTemplateViewController;

function stripSpaces(str = '') {
  return str.replace(/(\r\n|\n|\r)/gm, '');
}
