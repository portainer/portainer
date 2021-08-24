export default class ThemeSettingsController {
  /* @ngInject */
  constructor($async, $state, Authentication, ThemeManager, StateManager, UserService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.Authentication = Authentication;
    this.ThemeManager = ThemeManager;
    this.StateManager = StateManager;
    this.UserService = UserService;
    this.Notifications = Notifications;

    this.state = {
      userId: null,
      userTheme: '',
    };
  }

  /** Theme Settings Panel */
  setTheme(theme) {
    this.ThemeManager.setTheme(theme);
  }

  async updateTheme() {
    try {
      await this.UserService.updateUserTheme(this.state.userId, this.state.userTheme);
      this.Notifications.success('Success', 'User theme successfully updated');
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update user theme');
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state.userId = await this.Authentication.getUserDetails().ID;
      const data = await this.UserService.user(this.state.userId);
      this.state.userTheme = data.UserTheme || 'light';
    });
  }
}
