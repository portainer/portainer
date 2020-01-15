import angular from 'angular';
import _ from 'lodash-es';
import {KubernetesDeployManifestTypes} from 'Kubernetes/models/deploy';

class KubernetesDeployController {
  /* @ngInject */
  constructor($async, $state, Notifications, EndpointProvider, KubernetesNamespaceService, StackService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.StackService = StackService;

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

  async deployAsync() {
    this.state.actionInProgress = true;

    try {
      const compose = this.state.DeployType === this.ManifestDeployTypes.COMPOSE;
      await this.StackService.kubernetesDeploy(this.endpointId, this.formValues.Namespace, this.formValues.EditorContent, compose);
      this.Notifications.success('Manifest successfully deployed');
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable deploy resources');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  deploy() {
    return this.$async(this.deployAsync);
  }

  async getNamespacesAsync() {
    try {
      this.namespaces = await this.KubernetesNamespaceService.namespaces();
      this.formValues.Namespace = this.namespaces[0].Name;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load resource pools data');
    }
  }

  getNamespaces() {
    return this.$async(this.getNamespacesAsync);
  }

  async $onInit() {
    this.state = {
      DeployType: KubernetesDeployManifestTypes.KUBERNETES
    };

    this.formValues = {};

    this.ManifestDeployTypes = KubernetesDeployManifestTypes;

    this.endpointId = this.EndpointProvider.endpointID();
    this.getNamespaces();
  }
}

export default KubernetesDeployController;
angular.module('portainer.kubernetes').controller('KubernetesDeployController', KubernetesDeployController);