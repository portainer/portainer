import { queryKeys } from '@/portainer/users/queries/queryKeys';
import { queryClient } from '@/react-tools/react-query';
import { options } from './options';

export default class ThemeSettingsController {
  /* @ngInject */
  constructor($async, Authentication, ThemeManager, StateManager, UserService, Notifications) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.ThemeManager = ThemeManager;
    this.StateManager = StateManager;
    this.UserService = UserService;
    this.Notifications = Notifications;

    this.setThemeColor = this.setThemeColor.bind(this);
    this.setSubtleUpgradeButton = this.setSubtleUpgradeButton.bind(this);
  }

  async setThemeColor(color) {
    try {
      if (color === 'auto' || !color) {
        this.ThemeManager.autoTheme();
      } else {
        this.ThemeManager.setTheme(color);
      }

      this.state.themeColor = color;
      if (!this.state.isDemo) {
        await this.UserService.updateUserTheme(this.state.userId, { color });
      }
      await queryClient.invalidateQueries(queryKeys.user(this.state.userId));

      this.Notifications.success('Success', 'User theme successfully updated');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update user theme');
    }
  }

  async setSubtleUpgradeButton(value) {
    return this.$async(async () => {
      try {
        this.state.subtleUpgradeButton = value;
        if (!this.state.isDemo) {
          await this.UserService.updateUserTheme(this.state.userId, { subtleUpgradeButton: value });
        }

        await queryClient.invalidateQueries(queryKeys.user(this.state.userId));
        this.Notifications.success('Success', 'User theme successfully updated');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update user theme');
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      const state = this.StateManager.getState();

      this.state = {
        userId: null,
        themeColor: 'auto',
        isDemo: state.application.demoEnvironment.enabled,
        subtleUpgradeButton: false,
      };

      this.state.availableThemes = options;

      try {
        this.state.userId = await this.Authentication.getUserDetails().ID;
        const user = await this.UserService.user(this.state.userId);

        this.state.themeColor = user.ThemeSettings.color || this.state.themeColor;
        this.state.subtleUpgradeButton = !!user.ThemeSettings.subtleUpgradeButton;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to get user details');
      }
    });
  }
}
