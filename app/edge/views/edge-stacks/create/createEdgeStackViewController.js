import angular from 'angular';

class CreateEdgeStackViewController {
  constructor($state, EdgeStackService, EdgeGroupService, Notifications, FormHelper) {
    Object.assign(this, { $state, EdgeStackService, EdgeGroupService, Notifications, FormHelper });

    this.formValues = {
      Name: '',
      StackFileContent: '',
      StackFile: null,
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      Env: [],
      ComposeFilePathInRepository: 'docker-compose.yml',
      Groups: [],
    };

    this.state = {
      Method: 'editor',
      formValidationError: '',
      actionInProgress: false,
      StackType: null,
    };

    this.edgeGroups = null;

    this.createStack = this.createStack.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.createStackByMethod = this.createStackByMethod.bind(this);
    this.createStackFromFileContent = this.createStackFromFileContent.bind(this);
    this.createStackFromFileUpload = this.createStackFromFileUpload.bind(this);
    this.createStackFromGitRepository = this.createStackFromGitRepository.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  async $onInit() {
    this.edgeGroups = await this.EdgeGroupService.groups();
  }

  async createStack() {
    var name = this.formValues.Name;
    var method = this.state.Method;

    if (!this.validateForm(method)) {
      return;
    }

    this.state.actionInProgress = true;
    try {
      await this.createStackByMethod(name, method);

      this.Notifications.success('Stack successfully deployed');
      this.$state.go('edge.stacks');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Unable to deploy stack');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  validateForm(method) {
    this.state.formValidationError = '';

    if (method === 'editor' && this.formValues.StackFileContent === '') {
      this.state.formValidationError = 'Stack file content must not be empty';
      return;
    }

    return true;
  }

  createStackByMethod(name, method) {
    switch (method) {
      case 'editor':
        return this.createStackFromFileContent(name);
      case 'upload':
        return this.createStackFromFileUpload(name);
      case 'repository':
        return this.createStackFromGitRepository(name);
    }
  }

  createStackFromFileContent(name) {
    return this.EdgeStackService.createStackFromFileContent(
      name,
      this.formValues.StackFileContent,
      this.formValues.Groups
    );
  }

  createStackFromFileUpload(name) {
    return this.EdgeStackService.createStackFromFileUpload(name, this.formValues.StackFile, this.formValues.Groups);
  }

  createStackFromGitRepository(name) {
    const repositoryOptions = {
      RepositoryURL: this.formValues.RepositoryURL,
      RepositoryReferenceName: this.formValues.RepositoryReferenceName,
      ComposeFilePathInRepository: this.formValues.ComposeFilePathInRepository,
      RepositoryAuthentication: this.formValues.RepositoryAuthentication,
      RepositoryUsername: this.formValues.RepositoryUsername,
      RepositoryPassword: this.formValues.RepositoryPassword,
    };
    return this.EdgeStackService.createStackFromGitRepository(name, repositoryOptions, this.formValues.Groups);
  }

  editorUpdate(cm) {
    this.formValues.StackFileContent = cm.getValue();
  }
}

angular.module('portainer.edge').controller('CreateEdgeStackViewController', CreateEdgeStackViewController);
export default CreateEdgeStackViewController;
