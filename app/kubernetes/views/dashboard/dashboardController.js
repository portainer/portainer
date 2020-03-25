import angular from 'angular';

class KubernetesDashboardController {
  /* @ngInject */
  constructor($async, Notifications, EndpointService, EndpointProvider, KubernetesNamespaceService, KubernetesApplicationService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
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

  async onInit() {
    this.state = {
      viewReady: false
    };

    await this.getAll();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesDashboardController;
angular.module('portainer.kubernetes').controller('KubernetesDashboardController', KubernetesDashboardController);
