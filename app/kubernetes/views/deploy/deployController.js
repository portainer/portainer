import angular from 'angular';
import _ from 'lodash-es';
import stripAnsi from 'strip-ansi';
import { KubernetesDeployManifestTypes, KubernetesDeployBuildMethods, KubernetesDeployRequestMethods } from 'Kubernetes/models/deploy';

class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, $window, ModalService, Notifications, EndpointProvider, KubernetesResourcePoolService, StackService) {
    this.$async = $async;
    this.$state = $state;
    this.$window = $window;
    this.ModalService = ModalService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.StackService = StackService;

    this.deployOptions = [
      { id: 'method_kubernetes', icon: 'fa fa-cubes', label: 'Kubernetes', description: 'Kubernetes manifest format', value: KubernetesDeployManifestTypes.KUBERNETES },
      { id: 'method_compose', icon: 'fa fa-docker', label: 'Compose', description: 'docker-compose format', value: KubernetesDeployManifestTypes.COMPOSE },
    ];

    this.methodOptions = [
      { id: 'method_repo', icon: 'fab fa-github', label: 'Git Repository', description: 'Use a git repository', value: KubernetesDeployBuildMethods.GIT },
      { id: 'method_editor', icon: 'fa fa-edit', label: 'Web editor', description: 'Use our Web editor', value: KubernetesDeployBuildMethods.WEB_EDITOR },
    ];

    this.state = {
      DeployType: KubernetesDeployManifestTypes.KUBERNETES,
      BuildMethod: KubernetesDeployBuildMethods.GIT,
      tabLogsDisabled: true,
      activeTab: 0,
      viewReady: false,
      isEditorDirty: false,
    };

    this.formValues = {};
    this.ManifestDeployTypes = KubernetesDeployManifestTypes;
    this.BuildMethods = KubernetesDeployBuildMethods;
    this.endpointId = this.EndpointProvider.endpointID();

    this.onInit = this.onInit.bind(this);
    this.deployAsync = this.deployAsync.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.getNamespacesAsync = this.getNamespacesAsync.bind(this);
    this.onChangeFormValues = this.onChangeFormValues.bind(this);
  }

  disableDeploy() {
    const isGitFormInvalid =
      this.state.BuildMethod === KubernetesDeployBuildMethods.GIT &&
      (!this.formValues.RepositoryURL ||
        !this.formValues.FilePathInRepository ||
        (this.formValues.RepositoryAuthentication && (!this.formValues.RepositoryUsername || !this.formValues.RepositoryPassword)));
    const isWebEditorInvalid = this.state.BuildMethod === KubernetesDeployBuildMethods.WEB_EDITOR && _.isEmpty(this.formValues.EditorContent);

    return isGitFormInvalid || isWebEditorInvalid || _.isEmpty(this.formValues.Namespace) || this.state.actionInProgress;
  }

  onChangeFormValues(values) {
    this.formValues = {
      ...this.formValues,
      ...values,
    };
  }

  onChangeFileContent(value) {
    this.formValues.EditorContent = value;
    this.state.isEditorDirty = true;
  }

  displayErrorLog(log) {
    this.errorLog = stripAnsi(log);
    this.state.tabLogsDisabled = false;
    this.state.activeTab = 1;
  }

  async deployAsync() {
    this.errorLog = '';
    this.state.actionInProgress = true;

    try {
      const method = this.state.BuildMethod === this.BuildMethods.GIT ? KubernetesDeployRequestMethods.REPOSITORY : KubernetesDeployRequestMethods.STRING;

      const payload = {
        ComposeFormat: this.state.DeployType === this.ManifestDeployTypes.COMPOSE,
        Namespace: this.formValues.Namespace,
      };

      if (method === KubernetesDeployRequestMethods.REPOSITORY) {
        payload.RepositoryURL = this.formValues.RepositoryURL;
        payload.RepositoryReferenceName = this.formValues.RepositoryReferenceName;
        payload.RepositoryAuthentication = this.formValues.RepositoryAuthentication ? true : false;
        if (payload.RepositoryAuthentication) {
          payload.RepositoryUsername = this.formValues.RepositoryUsername;
          payload.RepositoryPassword = this.formValues.RepositoryPassword;
        }
        payload.FilePathInRepository = this.formValues.FilePathInRepository;
      } else {
        payload.StackFileContent = this.formValues.EditorContent;
      }

      await this.StackService.kubernetesDeploy(this.endpointId, method, payload);

      this.Notifications.success('Manifest successfully deployed');
      this.state.isEditorDirty = false;
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Unable to deploy manifest', err, 'Unable to deploy resources');
      this.displayErrorLog(err.err.data.details);
    } finally {
      this.state.actionInProgress = false;
    }
  }

  deploy() {
    return this.$async(this.deployAsync);
  }

  async getNamespacesAsync() {
    try {
      const pools = await this.KubernetesResourcePoolService.get();
      const namespaces = _.map(pools, 'Namespace').sort((a, b) => {
        if (a.Name === 'default') {
          return -1;
        }
        if (b.Name === 'default') {
          return 1;
        }
        return 0;
      });

      this.namespaces = namespaces;
      this.formValues.Namespace = this.namespaces[0].Name;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load namespaces data');
    }
  }

  getNamespaces() {
    return this.$async(this.getNamespacesAsync);
  }

  async uiCanExit() {
    if (this.formValues.EditorContent && this.state.isEditorDirty) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }
  async onInit() {
    await this.getNamespaces();

    this.state.viewReady = true;

    this.$window.onbeforeunload = () => {
      if (this.formValues.EditorContent && this.state.isEditorDirty) {
        return '';
      }
    };
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }
}

export default KubernetesDeployController;
angular.module('portainer.kubernetes').controller('KubernetesDeployController', KubernetesDeployController);
