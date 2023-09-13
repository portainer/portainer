import { EditorType } from '@/react/edge/edge-stacks/types';
import { getValidEditorTypes } from '@/react/edge/edge-stacks/utils';
import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';
import { confirmWebEditorDiscard } from '@@/modals/confirm';
import { baseEdgeStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export default class CreateEdgeStackViewController {
  /* @ngInject */
  constructor($state, $window, EdgeStackService, EdgeGroupService, EdgeTemplateService, Notifications, FormHelper, $async, $scope) {
    Object.assign(this, { $state, $window, EdgeStackService, EdgeGroupService, EdgeTemplateService, Notifications, FormHelper, $async, $scope });

    this.formValues = {
      Name: '',
      StackFileContent: '',
      StackFile: null,
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      ComposeFilePathInRepository: '',
      Groups: [],
      DeploymentType: 0,
      UseManifestNamespaces: false,
      TLSSkipVerify: false,
      envVars: [],
    };

    this.EditorType = EditorType;
    this.EnvironmentType = EnvironmentType;
    this.isBE = isBE;

    this.state = {
      Method: 'editor',
      formValidationError: '',
      actionInProgress: false,
      StackType: null,
      isEditorDirty: false,
      hasKubeEndpoint: false,
      endpointTypes: [],
      baseWebhookUrl: baseEdgeStackWebhookUrl(),
    };

    this.edgeGroups = null;

    $scope.STACK_NAME_VALIDATION_REGEX = STACK_NAME_VALIDATION_REGEX;

    this.createStack = this.createStack.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.createStackByMethod = this.createStackByMethod.bind(this);
    this.createStackFromFileContent = this.createStackFromFileContent.bind(this);
    this.createStackFromFileUpload = this.createStackFromFileUpload.bind(this);
    this.createStackFromGitRepository = this.createStackFromGitRepository.bind(this);
    this.onChangeGroups = this.onChangeGroups.bind(this);
    this.hasType = this.hasType.bind(this);
    this.onChangeDeploymentType = this.onChangeDeploymentType.bind(this);
    this.onEnvVarChange = this.onEnvVarChange.bind(this);
  }

  onEnvVarChange(envVars) {
    return this.$scope.$evalAsync(() => {
      this.formValues.envVars = envVars;
    });
  }

  buildAnalyticsProperties() {
    const format = 'compose';
    const metadata = { type: methodLabel(this.state.Method), format };

    if (metadata.type === 'template') {
      metadata.templateName = this.selectedTemplate.title;
    }

    return { metadata };

    function methodLabel(method) {
      switch (method) {
        case 'editor':
          return 'web-editor';
        case 'repository':
          return 'git';
        case 'upload':
          return 'file-upload';
        case 'template':
          return 'template';
      }
    }
  }

  uiCanExit() {
    if (this.state.Method === 'editor' && this.formValues.StackFileContent && this.state.isEditorDirty) {
      return confirmWebEditorDiscard();
    }
  }

  async $onInit() {
    try {
      this.edgeGroups = await this.EdgeGroupService.groups();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve Edge groups');
    }

    this.$window.onbeforeunload = () => {
      if (this.state.Method === 'editor' && this.formValues.StackFileContent && this.state.isEditorDirty) {
        return '';
      }
    };
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }

  createStack() {
    return this.$async(async () => {
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
        await this.createStackByMethod(name, method);

        this.Notifications.success('Success', 'Stack successfully deployed');
        this.state.isEditorDirty = false;
        this.$state.go('edge.stacks');
      } catch (err) {
        this.Notifications.error('Deployment error', err, 'Unable to deploy stack');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  onChangeGroups(groups) {
    return this.$scope.$evalAsync(() => {
      this.formValues.Groups = groups;

      this.checkIfEndpointTypes(groups);
    });
  }

  checkIfEndpointTypes(groups) {
    return this.$scope.$evalAsync(() => {
      const edgeGroups = groups.map((id) => this.edgeGroups.find((e) => e.Id === id));
      this.state.endpointTypes = edgeGroups.flatMap((group) => group.EndpointTypes);
      this.selectValidDeploymentType();
    });
  }

  selectValidDeploymentType() {
    const validTypes = getValidEditorTypes(this.state.endpointTypes);

    if (!validTypes.includes(this.formValues.DeploymentType)) {
      this.onChangeDeploymentType(validTypes[0]);
    }
  }

  hasType(envType) {
    return this.state.endpointTypes.includes(envType);
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
    const { StackFileContent, Groups, DeploymentType, UseManifestNamespaces, envVars } = this.formValues;

    return this.EdgeStackService.createStackFromFileContent({
      name,
      StackFileContent,
      EdgeGroups: Groups,
      DeploymentType,
      UseManifestNamespaces,
      envVars,
    });
  }

  createStackFromFileUpload(name) {
    const { StackFile, Groups, DeploymentType, UseManifestNamespaces, envVars } = this.formValues;
    return this.EdgeStackService.createStackFromFileUpload(
      {
        Name: name,
        EdgeGroups: Groups,
        DeploymentType,
        UseManifestNamespaces,
        envVars,
      },
      StackFile
    );
  }

  createStackFromGitRepository(name) {
    const { Groups, DeploymentType, UseManifestNamespaces, envVars } = this.formValues;
    const repositoryOptions = {
      RepositoryURL: this.formValues.RepositoryURL,
      RepositoryReferenceName: this.formValues.RepositoryReferenceName,
      FilePathInRepository: this.formValues.ComposeFilePathInRepository,
      RepositoryAuthentication: this.formValues.RepositoryAuthentication,
      RepositoryUsername: this.formValues.RepositoryUsername,
      RepositoryPassword: this.formValues.RepositoryPassword,
      TLSSkipVerify: this.formValues.TLSSkipVerify,
    };
    return this.EdgeStackService.createStackFromGitRepository(
      {
        name,
        EdgeGroups: Groups,
        DeploymentType,
        UseManifestNamespaces,
        envVars,
      },
      repositoryOptions
    );
  }

  onChangeDeploymentType(deploymentType) {
    return this.$scope.$evalAsync(() => {
      this.formValues.DeploymentType = deploymentType;
      this.state.Method = 'editor';
      this.formValues.StackFileContent = '';
    });
  }

  formIsInvalid() {
    return (
      this.form.$invalid ||
      !this.formValues.Groups.length ||
      (['template', 'editor'].includes(this.state.Method) && !this.formValues.StackFileContent) ||
      ('upload' === this.state.Method && !this.formValues.StackFile)
    );
  }
}
