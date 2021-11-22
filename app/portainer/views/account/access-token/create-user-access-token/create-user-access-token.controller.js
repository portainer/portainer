export default class CreateUserAccessTokenController {
  /* @ngInject */
  constructor($async, $state, $analytics, Authentication, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.$analytics = $analytics;
    this.Authentication = Authentication;
    this.Notifications = Notifications;

    this.onSubmit = this.onSubmit.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.onError = this.onError.bind(this);
  }

  onSubmit() {
    this.$analytics.eventTrack('portainer-account-access-token-create', { category: 'portainer' });
  }

  onSuccess() {
    this.$state.go('portainer.account', {}, { reload: true });
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
