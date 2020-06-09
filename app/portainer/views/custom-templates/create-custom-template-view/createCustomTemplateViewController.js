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
    };

    this.state = {
      Method: 'editor',
      formValidationError: '',
      actionInProgress: false,
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
    const title = this.formValues.Title;
    let method = this.state.Method;

    if (method === 'template') {
      method = 'editor';
    }

    if (!this.validateForm(method)) {
      return;
    }

    this.state.actionInProgress = true;
    try {
      await this.createCustomTemplateByMethod(title, method);

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

  createCustomTemplateByMethod(title, method) {
    switch (method) {
      case 'editor':
        return this.createCustomTemplateFromFileContent(title);
      case 'upload':
        return this.createCustomTemplateFromFileUpload(title);
      case 'repository':
        return this.createCustomTemplateFromGitRepository(title);
    }
  }

  createCustomTemplateFromFileContent(title) {
    return this.CustomTemplateService.createCustomTemplateFromFileContent(title, this.formValues.FileContent, this.formValues.Groups);
  }

  createCustomTemplateFromFileUpload(title) {
    return this.CustomTemplateService.createCustomTemplateFromFileUpload(title, this.formValues.File, this.formValues.Groups);
  }

  createCustomTemplateFromGitRepository(title) {
    const repositoryOptions = {
      RepositoryURL: this.formValues.RepositoryURL,
      RepositoryReferenceName: this.formValues.RepositoryReferenceName,
      ComposeFilePathInRepository: this.formValues.ComposeFilePathInRepository,
      RepositoryAuthentication: this.formValues.RepositoryAuthentication,
      RepositoryUsername: this.formValues.RepositoryUsername,
      RepositoryPassword: this.formValues.RepositoryPassword,
    };
    return this.CustomTemplateService.createCustomTemplateFromGitRepository(title, repositoryOptions, this.formValues.Groups);
  }

  editorUpdate(cm) {
    this.formValues.FileContent = cm.getValue();
  }

  async $onInit() {
    const { stackId } = this.$state.params;
    if (stackId) {
      const file = await this.StackService.getStackFile(stackId);
      this.formValues.FileContent = file;
    }
  }
}

export default CreateCustomTemplateViewController;
