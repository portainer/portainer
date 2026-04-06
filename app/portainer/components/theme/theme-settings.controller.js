import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import i18n from '@/i18n';
import { userQueryKeys } from '@/portainer/users/queries/queryKeys';
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
      await this.UserService.updateUserTheme(this.state.userId, theme);
      await queryClient.invalidateQueries(userQueryKeys.user(this.state.userId));

      notifySuccess(i18n.t('portainer_theme.success'), i18n.t('portainer_theme.theme_updated'));
    } catch (err) {
      notifyError(i18n.t('portainer_theme.failure'), err, i18n.t('portainer_theme.unable_update_theme'));
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        userId: null,
        themeColor: 'auto',
      };

      this.state.availableThemes = options;

      try {
        this.state.userId = await this.Authentication.getUserDetails().ID;
        const user = await this.UserService.user(this.state.userId);

        this.state.themeColor = user.ThemeSettings.color || this.state.themeColor;
      } catch (err) {
        notifyError(i18n.t('portainer_theme.failure'), err, i18n.t('portainer_theme.unable_get_user_details'));
      }
    });
  }
}
