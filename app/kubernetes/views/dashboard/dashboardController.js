import angular from 'angular';
import _ from 'lodash-es';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

class KubernetesDashboardController {
  /* @ngInject */
  constructor(
    $async,
    Notifications,
    EndpointService,
    KubernetesResourcePoolService,
    KubernetesApplicationService,
    KubernetesConfigurationService,
    KubernetesVolumeService,
    Authentication,
    TagService
  ) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.Authentication = Authentication;
    this.TagService = TagService;

    this.onInit = this.onInit.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    const isAdmin = this.Authentication.isAdmin();

    try {
      const [pools, applications, configurations, volumes, tags] = await Promise.all([
        this.KubernetesResourcePoolService.get(),
        this.KubernetesApplicationService.get(),
        this.KubernetesConfigurationService.get(),
        this.KubernetesVolumeService.get(),
        this.TagService.tags(),
      ]);
      this.applications = applications;
      this.volumes = volumes;

      this.endpointTags = this.endpoint.TagIds.length
        ? _.join(
            _.filter(
              _.map(this.endpoint.TagIds, (id) => {
                const tag = tags.find((tag) => tag.Id === id);
                return tag ? tag.Name : '';
              }),
              Boolean
            ),
            ', '
          )
        : '-';

      if (!isAdmin) {
        this.pools = _.filter(pools, (pool) => !KubernetesNamespaceHelper.isSystemNamespace(pool.Namespace.Name));
        this.configurations = _.filter(configurations, (config) => !KubernetesConfigurationHelper.isSystemToken(config));
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
      viewReady: false,
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
