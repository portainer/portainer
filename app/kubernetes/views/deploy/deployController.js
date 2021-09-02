import angular from 'angular';
import _ from 'lodash-es';
import stripAnsi from 'strip-ansi';

import { KubernetesDeployManifestTypes, KubernetesDeployBuildMethods, KubernetesDeployRequestMethods } from 'Kubernetes/models/deploy';
import { buildOption } from '@/portainer/components/box-selector';
class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, $window, CustomTemplateService, ModalService, Notifications, EndpointProvider, KubernetesResourcePoolService, StackService) {
    this.$async = $async;
    this.$state = $state;
    this.$window = $window;
    this.CustomTemplateService = CustomTemplateService;
    this.ModalService = ModalService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.StackService = StackService;

    this.deployOptions = [
      buildOption('method_kubernetes', 'fa fa-cubes', 'Kubernetes', 'Kubernetes manifest format', KubernetesDeployManifestTypes.KUBERNETES),
      buildOption('method_compose', 'fab fa-docker', 'Compose', 'docker-compose format', KubernetesDeployManifestTypes.COMPOSE),
    ];

    this.methodOptions = [
      buildOption('method_repo', 'fab fa-github', 'Git Repository', 'Use a git repository', KubernetesDeployBuildMethods.GIT),
      buildOption('method_editor', 'fa fa-edit', 'Web editor', 'Use our Web editor', KubernetesDeployBuildMethods.WEB_EDITOR),
      buildOption('method_template', 'fa fa-rocket', 'Custom Template', 'Use a custom template', KubernetesDeployBuildMethods.CUSTOM_TEMPLATE),
    ];

    this.state = {
      DeployType: KubernetesDeployManifestTypes.KUBERNETES,
      BuildMethod: KubernetesDeployBuildMethods.GIT,
      tabLogsDisabled: true,
      activeTab: 0,
      viewReady: false,
      isEditorDirty: false,
      templateId: null,
    };

    this.formValues = {};
    this.ManifestDeployTypes = KubernetesDeployManifestTypes;
    this.BuildMethods = KubernetesDeployBuildMethods;
    this.endpointId = this.EndpointProvider.endpointID();

    this.onChangeTemplateId = this.onChangeTemplateId.bind(this);
    this.deployAsync = this.deployAsync.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.getNamespacesAsync = this.getNamespacesAsync.bind(this);
    this.onChangeFormValues = this.onChangeFormValues.bind(this);
    this.onRepoUrlChange = this.onRepoUrlChange.bind(this);
    this.onRepoRefChange = this.onRepoRefChange.bind(this);
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

  onRepoUrlChange(value) {
    this.onChangeFormValues({ RepositoryURL: value });
  }

  onRepoRefChange(value) {
    this.onChangeFormValues({ RepositoryReferenceName: value });
  }

  onChangeTemplateId(templateId) {
    return this.$async(async () => {
      if (this.state.templateId === templateId) {
        return;
      }

      this.state.templateId = templateId;

      try {
        const fileContent = await this.CustomTemplateService.customTemplateFile(templateId);
        this.onChangeFileContent(fileContent);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load template file');
      }
    });
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
      let method = KubernetesDeployRequestMethods.STRING;
      let composeFormat = this.state.DeployType === this.ManifestDeployTypes.COMPOSE;

      switch (this.state.BuildMethod) {
        case KubernetesDeployBuildMethods.GIT:
          method = KubernetesDeployRequestMethods.REPOSITORY;
          break;
        case KubernetesDeployBuildMethods.CUSTOM_TEMPLATE:
          composeFormat = false;
          break;
      }

      const payload = {
        ComposeFormat: composeFormat,
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

  $onInit() {
    return this.$async(async () => {
      await this.getNamespaces();

      if (this.$state.params.templateId) {
        const templateId = parseInt(this.$state.params.templateId, 10);
        if (templateId && !Number.isNaN(templateId)) {
          this.state.BuildMethod = KubernetesDeployBuildMethods.CUSTOM_TEMPLATE;
          this.onChangeTemplateId(templateId);
        }
      }

      this.state.viewReady = true;

      this.$window.onbeforeunload = () => {
        if (this.formValues.EditorContent && this.state.isEditorDirty) {
          return '';
        }
      };
    });
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }
}

export default KubernetesDeployController;
angular.module('portainer.kubernetes').controller('KubernetesDeployController', KubernetesDeployController);
