import angular from 'angular';
import _ from 'lodash-es';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';

class KubernetesDashboardController {
  /* @ngInject */
  constructor($async, Notifications, EndpointService, EndpointProvider, KubernetesNamespaceService, KubernetesApplicationService, KubernetesConfigurationService, KubernetesVolumeService, KubernetesNamespaceHelper, Authentication) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.Authentication = Authentication;

    this.onInit = this.onInit.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    const isAdmin = this.Authentication.isAdmin();

    try {
      const endpointId = this.EndpointProvider.endpointID();
      const [endpoint, pools, applications, configurations, volumes] = await Promise.all([
        this.EndpointService.endpoint(endpointId),
        this.KubernetesNamespaceService.get(), // TODO: review, use ResourcePools instead of namespaces
        this.KubernetesApplicationService.get(),
        this.KubernetesConfigurationService.get(),
        this.KubernetesVolumeService.get()
      ]);
      this.endpoint = endpoint;
      this.applications = applications;
      this.volumes = volumes;

      if (!isAdmin) {
        this.pools = _.filter(pools, (pool) => {
          return !this.KubernetesNamespaceHelper.isSystemNamespace(pool.Name);
        });

        this.configurations = _.filter(configurations, (config) => {
          return !KubernetesConfigurationHelper.isSystemToken(config);
        });
      } else {
        this.pools = pools;
        this.configurations = configurations;
      }

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
