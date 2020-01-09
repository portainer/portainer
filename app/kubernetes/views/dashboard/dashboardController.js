import angular from 'angular';

class KubernetesDashboardController {
  /* @ngInject */
  constructor($async, Notifications, EndpointService, EndpointProvider, KubernetesResourcePoolService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    try {
      const endpointId = this.EndpointProvider.endpointID();
      const [endpoint, pools] = await Promise.all([
        this.EndpointService.endpoint(endpointId),
        this.KubernetesResourcePoolService.pools()
      ]);
      this.endpoint = endpoint;
      this.pools = pools;
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