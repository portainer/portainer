export default class HelmAddRepositoryController {
  /* @ngInject */
  constructor($async, $window, $analytics, HelmService, Notifications, EndpointProvider) {
    this.$async = $async;
    this.$window = $window;
    this.$analytics = $analytics;
    this.HelmService = HelmService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
  }

  async addRepository() {
    this.state.isAddingRepo = true;
    try {
      const { URL } = await this.HelmService.addHelmRepository(this.EndpointProvider.currentEndpoint().Id, { url: this.state.repository });
      this.Notifications.success('Helm repository added successfully');
      this.refreshCharts([URL], true);
    } catch (err) {
      this.Notifications.error('Installation error', err);
    } finally {
      this.state.isAddingRepo = false;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        isAddingRepo: false,
        repository: '',
      };
    });
  }
}
