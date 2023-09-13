import angular from 'angular';
import _ from 'lodash-es';
import stripAnsi from 'strip-ansi';

import PortainerError from '@/portainer/error';
import { KubernetesDeployManifestTypes, KubernetesDeployBuildMethods, KubernetesDeployRequestMethods, RepositoryMechanismTypes } from 'Kubernetes/models/deploy';
import { renderTemplate } from '@/react/portainer/custom-templates/components/utils';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { kubernetes } from '@@/BoxSelector/common-options/deployment-methods';
import { editor, git, customTemplate, url } from '@@/BoxSelector/common-options/build-methods';
import { parseAutoUpdateResponse, transformAutoUpdateViewModel } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { baseStackWebhookUrl, createWebhookId } from '@/portainer/helpers/webhookHelper';
import { confirmWebEditorDiscard } from '@@/modals/confirm';

class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, $window, Authentication, Notifications, KubernetesResourcePoolService, StackService, CustomTemplateService) {
    this.$async = $async;
    this.$state = $state;
    this.$window = $window;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.StackService = StackService;
    this.CustomTemplateService = CustomTemplateService;

    this.isTemplateVariablesEnabled = isBE;

    this.deployOptions = [{ ...kubernetes, value: KubernetesDeployManifestTypes.KUBERNETES }];

    this.methodOptions = [
      { ...git, value: KubernetesDeployBuildMethods.GIT },
      { ...editor, value: KubernetesDeployBuildMethods.WEB_EDITOR },
      { ...url, value: KubernetesDeployBuildMethods.URL },
      { ...customTemplate, value: KubernetesDeployBuildMethods.CUSTOM_TEMPLATE },
    ];

    this.state = {
      DeployType: KubernetesDeployManifestTypes.KUBERNETES,
      BuildMethod: KubernetesDeployBuildMethods.GIT,
      tabLogsDisabled: true,
      activeTab: 0,
      viewReady: false,
      isEditorDirty: false,
      templateId: null,
      template: null,
      baseWebhookUrl: baseStackWebhookUrl(),
      webhookId: createWebhookId(),
      templateLoadFailed: false,
      isEditorReadOnly: false,
    };

    this.currentUser = {
      isAdmin: false,
      id: null,
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
      Variables: {},
      AutoUpdate: parseAutoUpdateResponse(),
      TLSSkipVerify: false,
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
    this.onChangeTemplateVariables = this.onChangeTemplateVariables.bind(this);
  }

  onChangeTemplateVariables(value) {
    this.onChangeFormValues({ Variables: value });

    this.renderTemplate();
  }

  renderTemplate() {
    if (!this.isTemplateVariablesEnabled) {
      return;
    }

    const rendered = renderTemplate(this.state.templateContent, this.formValues.Variables, this.state.template.Variables);
    this.onChangeFormValues({ EditorContent: rendered });
  }

  buildAnalyticsProperties() {
    const metadata = {
      type: buildLabel(this.state.BuildMethod),
      format: formatLabel(this.state.DeployType),
      role: roleLabel(this.currentUser.isAdmin),
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
    return this.$async(async () => {
      this.state.BuildMethod = method;
    });
  }

  onChangeDeployType(type) {
    return this.$async(async () => {
      this.state.DeployType = type;
    });
  }

  disableDeploy() {
    const isWebEditorInvalid =
      this.state.BuildMethod === KubernetesDeployBuildMethods.WEB_EDITOR && _.isEmpty(this.formValues.EditorContent) && _.isEmpty(this.formValues.Namespace);
    const isURLFormInvalid = this.state.BuildMethod == KubernetesDeployBuildMethods.WEB_EDITOR.URL && _.isEmpty(this.formValues.ManifestURL);

    const isNamespaceInvalid = _.isEmpty(this.formValues.Namespace);
    return !this.formValues.StackName || isWebEditorInvalid || isURLFormInvalid || this.state.actionInProgress || isNamespaceInvalid;
  }

  onChangeFormValues(newValues) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...newValues,
      };
    });
  }

  onChangeTemplateId(templateId, template) {
    return this.$async(async () => {
      if (!template || (this.state.templateId === templateId && this.state.template === template)) {
        return;
      }

      this.state.templateId = templateId;
      this.state.template = template;

      try {
        try {
          this.state.templateContent = await this.CustomTemplateService.customTemplateFile(templateId, template.GitConfig !== null);
          this.onChangeFileContent(this.state.templateContent);

          this.state.isEditorReadOnly = true;
        } catch (err) {
          this.state.templateLoadFailed = true;
          throw err;
        }

        if (template.Variables && template.Variables.length > 0) {
          const variables = Object.fromEntries(template.Variables.map((variable) => [variable.name, '']));
          this.onChangeTemplateVariables(variables);
        }
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
        payload.TLSSkipVerify = this.formValues.TLSSkipVerify;
        payload.RepositoryURL = this.formValues.RepositoryURL;
        payload.RepositoryReferenceName = this.formValues.RepositoryReferenceName;
        payload.RepositoryAuthentication = this.formValues.RepositoryAuthentication ? true : false;
        if (payload.RepositoryAuthentication) {
          payload.RepositoryUsername = this.formValues.RepositoryUsername;
          payload.RepositoryPassword = this.formValues.RepositoryPassword;
        }
        payload.ManifestFile = this.formValues.ComposeFilePathInRepository;
        payload.AdditionalFiles = this.formValues.AdditionalFiles;
        payload.AutoUpdate = transformAutoUpdateViewModel(this.formValues.AutoUpdate, this.state.webhookId);
      } else if (method === KubernetesDeployRequestMethods.STRING) {
        payload.StackFileContent = this.formValues.EditorContent;
      } else {
        payload.ManifestURL = this.formValues.ManifestURL;
      }

      await this.StackService.kubernetesDeploy(this.endpoint.Id, method, payload);

      this.Notifications.success('Success', 'Request to deploy manifest successfully submitted');
      this.state.isEditorDirty = false;

      if (this.$state.params.referrer && this.$state.params.tab) {
        this.$state.go(this.$state.params.referrer, { tab: this.$state.params.tab });
        return;
      }

      if (this.$state.params.referrer) {
        this.$state.go(this.$state.params.referrer);
        return;
      }

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
      let namespaces = pools.filter((pool) => pool.Namespace.Status === 'Active');
      namespaces = _.map(namespaces, 'Namespace').sort((a, b) => {
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
      return confirmWebEditorDiscard();
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.currentUser.isAdmin = this.Authentication.isAdmin();
      this.currentUser.id = this.Authentication.getUserDetails().ID;

      this.formValues.namespace_toggle = false;
      await this.getNamespaces();

      if (this.$state.params.templateId) {
        const templateId = parseInt(this.$state.params.templateId, 10);
        if (templateId && !Number.isNaN(templateId)) {
          this.state.BuildMethod = KubernetesDeployBuildMethods.CUSTOM_TEMPLATE;
          this.state.templateId = templateId;
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
