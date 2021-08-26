export default class HelmAddRepositoryController {
  /* @ngInject */
  constructor($async, $window, $analytics, Authentication, UserService, Notifications) {
    this.$async = $async;
    this.$window = $window;
    this.$analytics = $analytics;
    this.Authentication = Authentication;
    this.UserService = UserService;
    this.Notifications = Notifications;
  }

  async addRepository() {
    this.state.isAddingRepo = true;
    try {
      const { URL } = await this.UserService.addHelmRepository(this.state.userId, this.state.repository);
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
        userId: this.Authentication.getUserDetails().ID,
      };
    });
  }
}
