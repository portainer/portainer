import _ from 'lodash';
import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

import { AccessControlFormData } from 'Portainer/components/accessControlForm/porAccessControlFormModel';
import { getTemplateVariables, intersectVariables } from '@/react/portainer/custom-templates/components/utils';
import { isBE } from '@/portainer/feature-flags/feature-flags.service';

class EditCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, $window, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService) {
    Object.assign(this, { $async, $state, $window, ModalService, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService });

    this.isTemplateVariablesEnabled = isBE;

    this.formValues = null;
    this.state = {
      formValidationError: '',
      isEditorDirty: false,
      isTemplateValid: true,
    };
    this.templates = [];

    this.getTemplate = this.getTemplate.bind(this);
    this.getTemplateAsync = this.getTemplateAsync.bind(this);
    this.submitAction = this.submitAction.bind(this);
    this.submitActionAsync = this.submitActionAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.onVariablesChange = this.onVariablesChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
      template.Variables = template.Variables || [];
      this.formValues = template;
      this.parseTemplate(template.FileContent);

      this.oldFileContent = this.formValues.FileContent;
      if (template.ResourceControl) {
        this.formValues.ResourceControl = new ResourceControlViewModel(template.ResourceControl);
      }
      this.formValues.AccessControlData = new AccessControlFormData();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve custom template data');
    }
  }

  onVariablesChange(value) {
    this.handleChange({ Variables: value });
  }

  handleChange(values) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...values,
      };
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
    const isNotUnique = _.some(this.templates, (template) => template.Title === title && template.Id != id);
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
    return this.$async(this.submitActionAsync);
  }
  async submitActionAsync() {
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
      this.$state.go('docker.templates.custom');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update custom template');
    } finally {
      this.actionInProgress = false;
    }
  }

  editorUpdate(cm) {
    const value = cm.getValue();
    if (this.formValues.FileContent.replace(/(\r\n|\n|\r)/gm, '') !== value.replace(/(\r\n|\n|\r)/gm, '')) {
      this.formValues.FileContent = value;
      this.parseTemplate(value);
      this.state.isEditorDirty = true;
    }
  }

  parseTemplate(templateStr) {
    if (!this.isTemplateVariablesEnabled) {
      return;
    }

    const variables = getTemplateVariables(templateStr);

    const isValid = !!variables;

    this.state.isTemplateValid = isValid;

    if (isValid) {
      this.onVariablesChange(intersectVariables(this.formValues.Variables, variables));
    }
  }

  async uiCanExit() {
    if (this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }

  async $onInit() {
    this.getTemplate();

    try {
      this.templates = await this.CustomTemplateService.customTemplates([1, 2]);
    } catch (err) {
      this.Notifications.error('Failure loading', err, 'Failed loading custom templates');
    }

    this.$window.onbeforeunload = () => {
      if (this.formValues.FileContent !== this.oldFileContent && this.state.isEditorDirty) {
        return '';
      }
    };
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }
}

export default EditCustomTemplateViewController;
