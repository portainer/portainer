export default class CreateUserAccessTokenController {
  /* @ngInject */
  constructor($async, $analytics, Authentication, UserService, Notifications) {
    this.$async = $async;
    this.$analytics = $analytics;
    this.Authentication = Authentication;
    this.UserService = UserService;
    this.Notifications = Notifications;

    this.onSubmit = this.onSubmit.bind(this);
    this.onError = this.onError.bind(this);
  }

  async onSubmit(description) {
    const accessToken = await this.UserService.createAccessToken(this.state.userId, description);
    // Dispatch analytics event upon success accessToken generation
    this.$analytics.eventTrack('portainer-account-access-token-create', { category: 'portainer' });
    return accessToken;
  }

  onError(heading, error, message) {
    this.Notifications.error(heading, error, message);
  }

  $onInit() {
    return this.$async(async () => {
      const userId = this.Authentication.getUserDetails().ID;
      this.state = {
        userId,
      };
    });
  }
}
