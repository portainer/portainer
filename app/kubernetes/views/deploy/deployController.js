import angular from 'angular';
import _ from 'lodash-es';
import stripAnsi from 'strip-ansi';
import uuidv4 from 'uuid/v4';
import PortainerError from 'Portainer/error';

import { KubernetesDeployManifestTypes, KubernetesDeployBuildMethods, KubernetesDeployRequestMethods, RepositoryMechanismTypes } from 'Kubernetes/models/deploy';
import { buildOption } from '@/portainer/components/BoxSelector';

class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, $window, Authentication, ModalService, Notifications, KubernetesResourcePoolService, StackService, WebhookHelper, CustomTemplateService) {
    this.$async = $async;
    this.$state = $state;
    this.$window = $window;
    this.Authentication = Authentication;
    this.ModalService = ModalService;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.StackService = StackService;
    this.WebhookHelper = WebhookHelper;
    this.CustomTemplateService = CustomTemplateService;
    this.DeployMethod = 'manifest';

    this.deployOptions = [
      buildOption('method_kubernetes', 'fa fa-cubes', 'Kubernetes', 'Kubernetes manifest format', KubernetesDeployManifestTypes.KUBERNETES),
      buildOption('method_compose', 'fab fa-docker', 'Compose', 'docker-compose format', KubernetesDeployManifestTypes.COMPOSE),
    ];

    this.methodOptions = [
      buildOption('method_repo', 'fab fa-github', 'Git Repository', 'Use a git repository', KubernetesDeployBuildMethods.GIT),
      buildOption('method_editor', 'fa fa-edit', 'Web editor', 'Use our Web editor', KubernetesDeployBuildMethods.WEB_EDITOR),
      buildOption('method_url', 'fa fa-globe', 'URL', 'Specify a URL to a file', KubernetesDeployBuildMethods.URL),
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

    this.formValues = {
      StackName: '',
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      AdditionalFiles: [],
      ComposeFilePathInRepository: '',
      RepositoryAutomaticUpdates: false,
      RepositoryMechanism: RepositoryMechanismTypes.INTERVAL,
      RepositoryFetchInterval: '5m',
      RepositoryWebhookURL: this.WebhookHelper.returnStackWebhookUrl(uuidv4()),
    };

    this.ManifestDeployTypes = KubernetesDeployManifestTypes;
    this.BuildMethods = KubernetesDeployBuildMethods;

    this.onChangeTemplateId = this.onChangeTemplateId.bind(this);
    this.deployAsync = this.deployAsync.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.getNamespacesAsync = this.getNamespacesAsync.bind(this);
    this.onChangeFormValues = this.onChangeFormValues.bind(this);
    this.buildAnalyticsProperties = this.buildAnalyticsProperties.bind(this);
    this.onChangeMethod = this.onChangeMethod.bind(this);
    this.onChangeDeployType = this.onChangeDeployType.bind(this);
  }

  buildAnalyticsProperties() {
    const metadata = {
      type: buildLabel(this.state.BuildMethod),
      format: formatLabel(this.state.DeployType),
      role: roleLabel(this.Authentication.isAdmin()),
      'automatic-updates': automaticUpdatesLabel(this.formValues.RepositoryAutomaticUpdates, this.formValues.RepositoryMechanism),
    };

    if (this.state.BuildMethod === KubernetesDeployBuildMethods.GIT) {
      metadata.auth = this.formValues.RepositoryAuthentication;
    }

    return { metadata };

    function automaticUpdatesLabel(repositoryAutomaticUpdates, repositoryMechanism) {
      switch (repositoryAutomaticUpdates && repositoryMechanism) {
        case RepositoryMechanismTypes.INTERVAL:
          return 'polling';
        case RepositoryMechanismTypes.WEBHOOK:
          return 'webhook';
        default:
          return 'off';
      }
    }

    function roleLabel(isAdmin) {
      if (isAdmin) {
        return 'admin';
      }

      return 'standard';
    }

    function buildLabel(buildMethod) {
      switch (buildMethod) {
        case KubernetesDeployBuildMethods.GIT:
          return 'git';
        case KubernetesDeployBuildMethods.WEB_EDITOR:
          return 'web-editor';
      }
    }

    function formatLabel(format) {
      switch (format) {
        case KubernetesDeployManifestTypes.COMPOSE:
          return 'compose';
        case KubernetesDeployManifestTypes.KUBERNETES:
          return 'manifest';
      }
    }
  }

  onChangeMethod(method) {
    this.state.BuildMethod = method;
  }

  onChangeDeployType(type) {
    this.state.DeployType = type;
    if (type == this.ManifestDeployTypes.COMPOSE) {
      this.DeployMethod = 'compose';
    } else {
      this.DeployMethod = 'manifest';
    }
  }

  disableDeploy() {
    const isGitFormInvalid =
      this.state.BuildMethod === KubernetesDeployBuildMethods.GIT &&
      (!this.formValues.RepositoryURL || !this.formValues.FilePathInRepository || (this.formValues.RepositoryAuthentication && !this.formValues.RepositoryPassword)) &&
      _.isEmpty(this.formValues.Namespace);
    const isWebEditorInvalid =
      this.state.BuildMethod === KubernetesDeployBuildMethods.WEB_EDITOR && _.isEmpty(this.formValues.EditorContent) && _.isEmpty(this.formValues.Namespace);
    const isURLFormInvalid = this.state.BuildMethod == KubernetesDeployBuildMethods.WEB_EDITOR.URL && _.isEmpty(this.formValues.ManifestURL);

    const isNamespaceInvalid = _.isEmpty(this.formValues.Namespace);
    return !this.formValues.StackName || isGitFormInvalid || isWebEditorInvalid || isURLFormInvalid || this.state.actionInProgress || isNamespaceInvalid;
  }

  onChangeFormValues(values) {
    this.formValues = {
      ...this.formValues,
      ...values,
    };
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
      let method;
      let composeFormat = this.state.DeployType === this.ManifestDeployTypes.COMPOSE;

      switch (this.state.BuildMethod) {
        case this.BuildMethods.GIT:
          method = KubernetesDeployRequestMethods.REPOSITORY;
          break;
        case this.BuildMethods.WEB_EDITOR:
          method = KubernetesDeployRequestMethods.STRING;
          break;
        case KubernetesDeployBuildMethods.CUSTOM_TEMPLATE:
          method = KubernetesDeployRequestMethods.STRING;
          composeFormat = false;
          break;
        case this.BuildMethods.URL:
          method = KubernetesDeployRequestMethods.URL;
          break;
        default:
          throw new PortainerError('Unable to determine build method');
      }

      let deployNamespace = '';

      if (this.formValues.namespace_toggle) {
        deployNamespace = '';
      } else {
        deployNamespace = this.formValues.Namespace;
      }

      const payload = {
        ComposeFormat: composeFormat,
        Namespace: deployNamespace,
        StackName: this.formValues.StackName,
      };

      if (method === KubernetesDeployRequestMethods.REPOSITORY) {
        payload.RepositoryURL = this.formValues.RepositoryURL;
        payload.RepositoryReferenceName = this.formValues.RepositoryReferenceName;
        payload.RepositoryAuthentication = this.formValues.RepositoryAuthentication ? true : false;
        if (payload.RepositoryAuthentication) {
          payload.RepositoryUsername = this.formValues.RepositoryUsername;
          payload.RepositoryPassword = this.formValues.RepositoryPassword;
        }
        payload.ManifestFile = this.formValues.ComposeFilePathInRepository;
        payload.AdditionalFiles = this.formValues.AdditionalFiles;
        if (this.formValues.RepositoryAutomaticUpdates) {
          payload.AutoUpdate = {};
          if (this.formValues.RepositoryMechanism === RepositoryMechanismTypes.INTERVAL) {
            payload.AutoUpdate.Interval = this.formValues.RepositoryFetchInterval;
          } else if (this.formValues.RepositoryMechanism === RepositoryMechanismTypes.WEBHOOK) {
            payload.AutoUpdate.Webhook = this.formValues.RepositoryWebhookURL.split('/').reverse()[0];
          }
        }
      } else if (method === KubernetesDeployRequestMethods.STRING) {
        payload.StackFileContent = this.formValues.EditorContent;
      } else {
        payload.ManifestURL = this.formValues.ManifestURL;
      }

      await this.StackService.kubernetesDeploy(this.endpoint.Id, method, payload);

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
      if (this.namespaces.length > 0) {
        this.formValues.Namespace = this.namespaces[0].Name;
      }
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
      this.formValues.namespace_toggle = false;
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
