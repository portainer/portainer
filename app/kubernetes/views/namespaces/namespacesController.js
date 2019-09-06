import angular from 'angular';

class KubernetesNamespacesController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesNamespaceService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesNamespaceService = KubernetesNamespaceService;

    this.getNamespaces = this.getNamespaces.bind(this);
    this.getNamespacesAsync = this.getNamespacesAsync.bind(this);
  }

  async getNamespacesAsync() {
    try {
      this.namespaces = await this.KubernetesNamespaceService.namespaces();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve namespaces');
    }
  }

  getNamespaces() {
    return this.$async(this.getNamespacesAsync);
  }

  async $onInit() {
    this.getNamespaces();
  }
}

export default KubernetesNamespacesController;
angular.module('portainer.kubernetes').controller('KubernetesNamespacesController', KubernetesNamespacesController);
