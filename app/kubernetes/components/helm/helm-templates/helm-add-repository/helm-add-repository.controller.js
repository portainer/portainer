export default class HelmAddRepositoryController {
  /* @ngInject */
  constructor($state, $async, HelmService, Notifications, EndpointProvider) {
    this.$state = $state;
    this.$async = $async;
    this.HelmService = HelmService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
  }

  doesRepoExist() {
    if (!this.state.repository) {
      return false;
    }
    // lowercase, strip trailing slash and compare
    return this.repos.includes(this.state.repository.toLowerCase().replace(/\/$/, ''));
  }

  async addRepository() {
    this.state.isAddingRepo = true;
    try {
      await this.HelmService.addHelmRepository(this.EndpointProvider.currentEndpoint().Id, { url: this.state.repository });
      this.Notifications.success('Helm repository added successfully');
      this.$state.reload(this.$state.current);
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
