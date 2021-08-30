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
  }

  /** Theme Settings Panel */
  setLightTheme() {
    this.ThemeManager.setTheme(this.state.availableTheme.light);
  }

  setDarkTheme() {
    this.ThemeManager.setTheme(this.state.availableTheme.dark);
  }

  setHighContrastTheme() {
    this.ThemeManager.setTheme(this.state.availableTheme.highContrast);
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
      this.state = {
        userId: null,
        userTheme: '',
      };

      this.state.availableTheme = {
        light: 'light',
        dark: 'dark',
        highContrast: 'highcontrast',
      };

      this.state.userId = await this.Authentication.getUserDetails().ID;
      const data = await this.UserService.user(this.state.userId);
      this.state.userTheme = data.UserTheme || this.state.availableTheme.light;
    });
  }
}
