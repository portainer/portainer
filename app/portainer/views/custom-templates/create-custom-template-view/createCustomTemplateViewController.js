class CreateCustomTemplateViewController {
  /* @ngInject */
  constructor($async, $state, CustomTemplateService, Notifications, StackService) {
    Object.assign(this, { $async, $state, CustomTemplateService, Notifications, StackService });

    this.formValues = {
      Title: '',
      FileContent: '',
      File: null,
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      ComposeFilePathInRepository: 'docker-compose.yml',
      Description: '',
      Note: '',
      Platform: 1,
      Type: 1,
    };

    this.state = {
      Method: 'editor',
      formValidationError: '',
      actionInProgress: false,
      fromStack: false,
      loading: true,
    };

    this.createCustomTemplate = this.createCustomTemplate.bind(this);
    this.createCustomTemplateAsync = this.createCustomTemplateAsync.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.createCustomTemplateByMethod = this.createCustomTemplateByMethod.bind(this);
    this.createCustomTemplateFromFileContent = this.createCustomTemplateFromFileContent.bind(this);
    this.createCustomTemplateFromFileUpload = this.createCustomTemplateFromFileUpload.bind(this);
    this.createCustomTemplateFromGitRepository = this.createCustomTemplateFromGitRepository.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
  }

  createCustomTemplate() {
    return this.$async(this.createCustomTemplateAsync);
  }

  onChangeMethod() {
    this.formValues.FileContent = '';
    this.selectedTemplate = null;
  }

  async createCustomTemplateAsync() {
    let method = this.state.Method;

    if (method === 'template') {
      method = 'editor';
    }

    if (!this.validateForm(method)) {
      return;
    }

    this.state.actionInProgress = true;
    try {
      await this.createCustomTemplateByMethod(method);

      this.Notifications.success('Custom template successfully created');
      this.$state.go('portainer.templates.custom');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Unable to create custom template');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  validateForm(method) {
    this.state.formValidationError = '';

    if (method === 'editor' && this.formValues.FileContent === '') {
      this.state.formValidationError = 'Template file content must not be empty';
      return;
    }

    return true;
  }

  createCustomTemplateByMethod(method) {
    switch (method) {
      case 'editor':
        return this.createCustomTemplateFromFileContent();
      case 'upload':
        return this.createCustomTemplateFromFileUpload();
      case 'repository':
        return this.createCustomTemplateFromGitRepository();
    }
  }

  createCustomTemplateFromFileContent() {
    return this.CustomTemplateService.createCustomTemplateFromFileContent(this.formValues);
  }

  createCustomTemplateFromFileUpload() {
    return this.CustomTemplateService.createCustomTemplateFromFileUpload(this.formValues);
  }

  createCustomTemplateFromGitRepository() {
    return this.CustomTemplateService.createCustomTemplateFromGitRepository(this.formValues);
  }

  editorUpdate(cm) {
    this.formValues.FileContent = cm.getValue();
  }

  async $onInit() {
    const { stackId } = this.$state.params;
    if (stackId) {
      this.state.fromStack = true;
      const [stack, file] = await Promise.all([this.StackService.stack(stackId), this.StackService.getStackFile(stackId)]);

      this.formValues.FileContent = file;
      this.formValues.Type = stack.Type;
    }
    this.state.loading = false;
  }
}

export default CreateCustomTemplateViewController;
