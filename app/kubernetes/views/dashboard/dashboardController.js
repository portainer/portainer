import angular from 'angular';

class KubernetesDashboardController {
  /* @ngInject */
  constructor($async, Notifications, Authentication, EndpointService, EndpointProvider, KubernetesNamespaceService, KubernetesApplicationService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    try {
      const endpointId = this.EndpointProvider.endpointID();
      const [endpoint, pools, applications] = await Promise.all([
        this.EndpointService.endpoint(endpointId),
        this.KubernetesNamespaceService.get(), // TODO: review, use ResourcePools instead of namespaces
        this.KubernetesApplicationService.get(),
      ]);
      this.endpoint = endpoint;
      this.pools = pools;
      this.applications = applications;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load dashboard data');
    }
  }

  getAll() {
    return this.$async(this.getAllAsync);
  }

  async $onInit() {
    this.isAdmin = this.Authentication.isAdmin();
    this.getAll();
  }
}

export default KubernetesDashboardController;
angular.module('portainer.kubernetes').controller('KubernetesDashboardController', KubernetesDashboardController);