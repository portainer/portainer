import angular from 'angular';

class KubernetesDashboardController {
  /* @ngInject */
  constructor($async, Notifications, EndpointService, EndpointProvider, KubernetesNamespaceService) {//, KubernetesServiceService, KubernetesContainerService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    // this.KubernetesServiceService = KubernetesServiceService;
    // this.KubernetesContainerService = KubernetesContainerService;

    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    try {
      const endpointId = this.EndpointProvider.endpointID();
      const [endpoint, namespaces, services, containers] = await Promise.all([
        this.EndpointService.endpoint(endpointId),
        this.KubernetesNamespaceService.namespaces(),
        // this.KubernetesServiceService.services(),
        // this.KubernetesContainerService.containers()
      ]);
      this.endpoint = endpoint;
      this.namespaces = namespaces;
      this.services = services;
      this.containers = containers;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load dashboard data');
    }
  }

  getAll() {
    return this.$async(this.getAllAsync);
  }

  async $onInit() {
    this.getAll();
  }
}

export default KubernetesDashboardController;
angular.module('portainer.kubernetes').controller('KubernetesDashboardController', KubernetesDashboardController);