import angular from 'angular';
import _ from 'lodash-es';
import stripAnsi from 'strip-ansi';
import {KubernetesDeployManifestTypes} from 'Kubernetes/models/deploy';

class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, Notifications, EndpointProvider, KubernetesNamespaceService, StackService, Authentication) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.StackService = StackService;
    this.Authentication = Authentication;

    this.deployAsync = this.deployAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.getNamespacesAsync = this.getNamespacesAsync.bind(this);
  }

  disableDeploy() {
    return _.isEmpty(this.formValues.EditorContent) || _.isEmpty(this.formValues.Namespace) || this.state.actionInProgress;
  }

  async editorUpdateAsync(cm) {
    this.formValues.EditorContent = cm.getValue();
  }

  editorUpdate(cm) {
    return this.$async(this.editorUpdateAsync, cm);
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
      const compose = this.state.DeployType === this.ManifestDeployTypes.COMPOSE;
      await this.StackService.kubernetesDeploy(this.endpointId, this.formValues.Namespace, this.formValues.EditorContent, compose);
      this.Notifications.success('Manifest successfully deployed');
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

  // TODO: review, use ResourcePools instead of Namespaces
  async getNamespacesAsync() {
    try {
      this.namespaces = await this.KubernetesNamespaceService.get();
      this.formValues.Namespace = this.namespaces[0].Name;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load resource pools data');
    }
  }

  getNamespaces() {
    return this.$async(this.getNamespacesAsync);
  }

  async $onInit() {
    if (!this.Authentication.isAdmin()) {
      this.$state.go('portainer.home');
      return;
    }
    this.state = {
      DeployType: KubernetesDeployManifestTypes.KUBERNETES,
      tabLogsDisabled: true,
      activeTab: 0
    };

    this.formValues = {};

    this.ManifestDeployTypes = KubernetesDeployManifestTypes;

    this.endpointId = this.EndpointProvider.endpointID();
    this.getNamespaces();
  }
}

export default KubernetesDeployController;
angular.module('portainer.kubernetes').controller('KubernetesDeployController', KubernetesDeployController);
