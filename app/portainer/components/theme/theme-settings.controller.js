import { buildOption } from '@/portainer/components/BoxSelector';

export default class ThemeSettingsController {
  /* @ngInject */
  constructor($async, Authentication, ThemeManager, StateManager, UserService, Notifications) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.ThemeManager = ThemeManager;
    this.StateManager = StateManager;
    this.UserService = UserService;
    this.Notifications = Notifications;

    this.setTheme = this.setTheme.bind(this);
  }

  async setTheme(theme) {
    try {
      if (theme === 'auto' || !theme) {
        this.ThemeManager.autoTheme();
      } else {
        this.ThemeManager.setTheme(theme);
      }
      this.state.userTheme = theme;
      await this.UserService.updateUserTheme(this.state.userId, this.state.userTheme);
      this.Notifications.success('Success', 'User theme successfully updated');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update user theme');
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        userId: null,
        userTheme: '',
        defaultTheme: 'auto',
      };

      this.state.availableThemes = [
        buildOption('light', 'fas fa-sun', 'Light Theme', 'Default color mode', 'light'),
        buildOption('dark', 'fas fa-moon', 'Dark Theme', 'Dark color mode', 'dark'),
        buildOption('highcontrast', 'fas fa-adjust', 'High Contrast', 'High contrast color mode', 'highcontrast'),
        buildOption('auto', 'fas fa-sync-alt', 'Auto', 'Sync with system theme', 'auto'),
      ];

      try {
        this.state.userId = await this.Authentication.getUserDetails().ID;
        const data = await this.UserService.user(this.state.userId);
        this.state.userTheme = data.UserTheme || this.state.defaultTheme;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to get user details');
      }
    });
  }
}
