import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { queryKeys } from '@/portainer/users/queries/queryKeys';
import { queryClient } from '@/react-tools/react-query';
import { options } from '@/react/portainer/account/AccountView/theme-options';

export default class ThemeSettingsController {
  /* @ngInject */
  constructor($async, Authentication, ThemeManager, StateManager, UserService) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.ThemeManager = ThemeManager;
    this.StateManager = StateManager;
    this.UserService = UserService;

    this.setThemeColor = this.setThemeColor.bind(this);
  }

  async setThemeColor(color) {
    return this.$async(async () => {
      if (color === 'auto' || !color) {
        this.ThemeManager.autoTheme();
      } else {
        this.ThemeManager.setTheme(color);
      }

      this.state.themeColor = color;
      this.updateThemeSettings({ color });
    });
  }

  async updateThemeSettings(theme) {
    try {
      if (!this.state.isDemo) {
        await this.UserService.updateUserTheme(this.state.userId, theme);
        await queryClient.invalidateQueries(queryKeys.user(this.state.userId));
      }

      notifySuccess('Success', 'User theme settings successfully updated');
    } catch (err) {
      notifyError('Failure', err, 'Unable to update user theme settings');
    }
  }

  $onInit() {
    return this.$async(async () => {
      const state = this.StateManager.getState();

      this.state = {
        userId: null,
        themeColor: 'auto',
        isDemo: state.application.demoEnvironment.enabled,
      };

      this.state.availableThemes = options;

      try {
        this.state.userId = await this.Authentication.getUserDetails().ID;
        const user = await this.UserService.user(this.state.userId);

        this.state.themeColor = user.ThemeSettings.color || this.state.themeColor;
      } catch (err) {
        notifyError('Failure', err, 'Unable to get user details');
      }
    });
  }
}
