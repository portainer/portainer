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

  /** Theme Settings Panel */
  async updateTheme() {
    try {
      await this.UserService.updateUserTheme(this.state.userId, this.state.userTheme);
      this.state.themeInProgress = false;
      this.Notifications.success('Success', 'User theme successfully updated');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update user theme');
    }
  }

  setTheme(theme) {
    if (theme === 'auto' || !theme) {
      this.ThemeManager.autoTheme();
    } else {
      this.ThemeManager.setTheme(theme);
    }
    this.state.themeInProgress = true;
    this.state.userTheme = theme;
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        userId: null,
        userTheme: '',
        initTheme: '',
        defaultTheme: 'auto',
        themeInProgress: false,
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
        this.state.initTheme = this.state.userTheme;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to get user details');
      }
    });
  }

  $onDestroy() {
    if (this.state.themeInProgress) {
      this.ThemeManager.setTheme(this.state.initTheme);
    }
  }
}
