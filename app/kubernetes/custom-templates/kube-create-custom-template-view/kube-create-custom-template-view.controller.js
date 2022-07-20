import { buildOption } from '@/portainer/components/BoxSelector';
import { AccessControlFormData } from '@/portainer/components/accessControlForm/porAccessControlFormModel';
import { getTemplateVariables, intersectVariables } from '@/react/portainer/custom-templates/components/utils';
import { isBE } from '@/portainer/feature-flags/feature-flags.service';

class KubeCreateCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, Authentication, CustomTemplateService, FormValidator, ModalService, Notifications, ResourceControlService) {
    Object.assign(this, { $async, $state, Authentication, CustomTemplateService, FormValidator, ModalService, Notifications, ResourceControlService });

    this.methodOptions = [
      buildOption('method_editor', 'fa fa-edit', 'Web editor', 'Use our Web editor', 'editor'),
      buildOption('method_upload', 'fa fa-upload', 'Upload', 'Upload from your computer', 'upload'),
    ];

    this.templates = null;
    this.isTemplateVariablesEnabled = isBE;

    this.state = {
      method: 'editor',
      actionInProgress: false,
      formValidationError: '',
      isEditorDirty: false,
      isTemplateValid: true,
    };

    this.formValues = {
      FileContent: '',
      File: null,
      Title: '',
      Description: '',
      Note: '',
      Logo: '',
      AccessControlData: new AccessControlFormData(),
      Variables: [],
    };

    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
    this.onBeforeOnload = this.onBeforeOnload.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onVariablesChange = this.onVariablesChange.bind(this);
  }

  onChangeMethod(method) {
    this.state.method = method;
    this.formValues.Variables = [];
  }

  onChangeFileContent(content) {
    this.handleChange({ FileContent: content });
    this.parseTemplate(content);
    this.state.isEditorDirty = true;
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

  onVariablesChange(value) {
    this.handleChange({ Variables: value });
  }

  onChangeFile(file) {
    this.handleChange({ File: file });
  }

  handleChange(values) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...values,
      };
    });
  }

  async createCustomTemplate() {
    return this.$async(async () => {
      const { method } = this.state;

      if (!this.validateForm(method)) {
        return;
      }

      this.state.actionInProgress = true;
      try {
        const customTemplate = await this.createCustomTemplateByMethod(method, this.formValues);

        const accessControlData = this.formValues.AccessControlData;
        const userDetails = this.Authentication.getUserDetails();
        const userId = userDetails.ID;
        await this.ResourceControlService.applyResourceControl(userId, accessControlData, customTemplate.ResourceControl);

        this.Notifications.success('Custom template successfully created');
        this.state.isEditorDirty = false;
        this.$state.go('kubernetes.templates.custom');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed creating custom template');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  createCustomTemplateByMethod(method, template) {
    template.Type = 3;

    switch (method) {
      case 'editor':
        return this.createCustomTemplateFromFileContent(template);
      case 'upload':
        return this.createCustomTemplateFromFileUpload(template);
    }
  }

  createCustomTemplateFromFileContent(template) {
    return this.CustomTemplateService.createCustomTemplateFromFileContent(template);
  }

  createCustomTemplateFromFileUpload(template) {
    return this.CustomTemplateService.createCustomTemplateFromFileUpload(template);
  }

  validateForm(method) {
    this.state.formValidationError = '';

    if (method === 'editor' && this.formValues.FileContent === '') {
      this.state.formValidationError = 'Template file content must not be empty';
      return false;
    }

    const title = this.formValues.Title;
    const isNotUnique = this.templates.some((template) => template.Title === title);
    if (isNotUnique) {
      this.state.formValidationError = 'A template with the same name already exists';
      return false;
    }

    if (!this.state.isTemplateValid) {
      this.state.formValidationError = 'Template is not valid';
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

  async $onInit() {
    return this.$async(async () => {
      const { fileContent, type } = this.$state.params;

      this.formValues.FileContent = fileContent;
      this.parseTemplate(fileContent);
      if (type) {
        this.formValues.Type = +type;
      }

      try {
        this.templates = await this.CustomTemplateService.customTemplates(3);
      } catch (err) {
        this.Notifications.error('Failure loading', err, 'Failed loading custom templates');
      }

      this.state.loading = false;

      window.addEventListener('beforeunload', this.onBeforeOnload);
    });
  }

  $onDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeOnload);
  }

  isEditorDirty() {
    return this.state.method === 'editor' && this.formValues.FileContent && this.state.isEditorDirty;
  }

  onBeforeOnload(event) {
    if (this.isEditorDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  uiCanExit() {
    if (this.isEditorDirty()) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }
}

export default KubeCreateCustomTemplateViewController;
