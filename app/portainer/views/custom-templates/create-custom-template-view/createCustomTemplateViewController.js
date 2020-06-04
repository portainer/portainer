class CreateCustomTemplateViewController {
  constructor($async, $state, CustomTemplateService, Notifications, FormHelper) {
    Object.assign(this, { $async, $state, CustomTemplateService, Notifications, FormHelper });

    this.formValues = {
      Name: '',
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

  async $onInit() {}

  createCustomTemplate() {
    return this.$async(this.createCustomTemplateAsync);
  }

  onChangeMethod() {
    this.formValues.FileContent = '';
    this.selectedTemplate = null;
  }

  async createCustomTemplateAsync() {
    const name = this.formValues.Name;
    let method = this.state.Method;

    if (method === 'template') {
      method = 'editor';
    }

    if (!this.validateForm(method)) {
      return;
    }

    this.state.actionInProgress = true;
    try {
      await this.createCustomTemplateByMethod(name, method);

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

  createCustomTemplateByMethod(name, method) {
    switch (method) {
      case 'editor':
        return this.createCustomTemplateFromFileContent(name);
      case 'upload':
        return this.createCustomTemplateFromFileUpload(name);
      case 'repository':
        return this.createCustomTemplateFromGitRepository(name);
    }
  }

  createCustomTemplateFromFileContent(name) {
    return this.CustomTemplateService.createCustomTemplateFromFileContent(name, this.formValues.FileContent, this.formValues.Groups);
  }

  createCustomTemplateFromFileUpload(name) {
    return this.CustomTemplateService.createCustomTemplateFromFileUpload(name, this.formValues.File, this.formValues.Groups);
  }

  createCustomTemplateFromGitRepository(name) {
    const repositoryOptions = {
      RepositoryURL: this.formValues.RepositoryURL,
      RepositoryReferenceName: this.formValues.RepositoryReferenceName,
      ComposeFilePathInRepository: this.formValues.ComposeFilePathInRepository,
      RepositoryAuthentication: this.formValues.RepositoryAuthentication,
      RepositoryUsername: this.formValues.RepositoryUsername,
      RepositoryPassword: this.formValues.RepositoryPassword,
    };
    return this.CustomTemplateService.createCustomTemplateFromGitRepository(name, repositoryOptions, this.formValues.Groups);
  }

  editorUpdate(cm) {
    this.formValues.FileContent = cm.getValue();
  }
}

export default CreateCustomTemplateViewController;
