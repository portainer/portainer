import { AccessControlFormData } from '@/portainer/components/accessControlForm/porAccessControlFormModel';
import { getTemplateVariables, intersectVariables, isTemplateVariablesEnabled } from '@/react/portainer/custom-templates/components/utils';
import { editor, upload, git } from '@@/BoxSelector/common-options/build-methods';
import { confirmWebEditorDiscard } from '@@/modals/confirm';
import { KUBE_TEMPLATE_NAME_VALIDATION_REGEX } from '@/constants';

class KubeCreateCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService) {
    Object.assign(this, { $async, $state, Authentication, CustomTemplateService, FormValidator, Notifications, ResourceControlService });

    this.methodOptions = [editor, upload, git];

    this.templates = null;
    this.isTemplateVariablesEnabled = isTemplateVariablesEnabled;

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
      RepositoryURL: '',
      RepositoryURLValid: false,
      RepositoryReferenceName: 'refs/heads/main',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      ComposeFilePathInRepository: 'manifest.yml',
    };

    this.validationData = {
      title: {
        pattern: KUBE_TEMPLATE_NAME_VALIDATION_REGEX,
        error:
          "This field must consist of lower-case alphanumeric characters, '.', '_' or '-', must start and end with an alphanumeric character and must be 63 characters or less (e.g. 'my-name', or 'abc-123').",
      },
    };

    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
    this.onBeforeOnload = this.onBeforeOnload.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onVariablesChange = this.onVariablesChange.bind(this);
    this.onChangePlatform = this.onChangePlatform.bind(this);
    this.onChangeType = this.onChangeType.bind(this);
  }

  onChangePlatform(value) {
    this.handleChange({ Platform: value });
  }

  onChangeType(value) {
    this.handleChange({ Type: value });
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

    const [variables] = getTemplateVariables(templateStr);

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

        this.Notifications.success('Success', 'Custom template successfully created');
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
      case 'repository':
        return this.createCustomTemplateFromGitRepository(template);
    }
  }

  createCustomTemplateFromFileContent(template) {
    return this.CustomTemplateService.createCustomTemplateFromFileContent(template);
  }

  createCustomTemplateFromFileUpload(template) {
    return this.CustomTemplateService.createCustomTemplateFromFileUpload(template);
  }

  createCustomTemplateFromGitRepository(template) {
    return this.CustomTemplateService.createCustomTemplateFromGitRepository(template);
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
      return confirmWebEditorDiscard();
    }
  }
}

export default KubeCreateCustomTemplateViewController;
