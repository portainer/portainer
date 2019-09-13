import angular from 'angular';
import _ from 'lodash-es';

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
    return _.isEmpty(this.formValues.EditorContent) || _.isEmpty(this.formValues.Namespace);
  }

  getPlaceholder() {
    if (this.state.Method === this.state.MethodValues.COMPOSE) {
      return '# Define or paste the content of your docker-compose file here';
    }
    return '# Define or paste the content of your docker-compose file here';
  }

  async editorUpdateAsync(cm) {
    this.formValues.EditorContent = cm.getValue();
  }

  editorUpdate(cm) {
    return this.$async(this.editorUpdateAsync, cm);
  }

  async deployAsync() {
    try {
      this.state.actionInProgress = true;
      const compose = this.state.Method === this.state.MethodValues.COMPOSE;
      await this.StackService.kubernetesDeploy(this.endpointId, this.formValues.Namespace, this.formValues.EditorContent, compose);
      this.$state.go('kubernetes.services');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable deploy resources');
      this.state.actionInProgress = false;
    }
  }

  deploy() {
    return this.$async(this.deployAsync);
  }

  async getNamespacesAsync() {
    try {
      this.namespaces = await this.KubernetesNamespaceService.namespaces();
      this.formValues.Namespace = 'default';
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load namespaces data');
    }
  }

  getNamespaces() {
    return this.$async(this.getNamespacesAsync);
  }

  async $onInit() {
    this.endpointId = this.EndpointProvider.endpointID();
    this.state = {
        MethodValues: {
        COMPOSE: 'compose',
        KUBERNETES: 'kubernetes'
      },
      Method: 'compose'
    };
    this.formValues = {};
    this.getNamespaces();
  }
}

export default KubernetesDeployController;
angular.module('portainer.kubernetes').controller('KubernetesDeployController', KubernetesDeployController);
