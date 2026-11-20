import angular from 'angular';
import { dispatchCacheRefreshEvent } from '@/portainer/services/http-request.helper';
import { cleanReturnUrl } from '@/react/portainer/helpers/returnUrl';

class LogoutController {
  /* @ngInject */
  constructor($async, $state, $transition$, $window, Authentication, StateManager, Notifications, LocalStorage, SettingsService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.$window = $window;

    this.Authentication = Authentication;
    this.StateManager = StateManager;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.SettingsService = SettingsService;

    this.logo = this.StateManager.getState().application.logo;
    this.logoutAsync = this.logoutAsync.bind(this);

    this.onInit = this.onInit.bind(this);
  }

  /**
   * UTILS FUNCTIONS SECTION
   */
  async logoutAsync() {
    const error = this.$transition$.params().error;
    const settings = await this.SettingsService.publicSettings();

    // Capture the user details BEFORE logout: Authentication.logout()
    // clears the user data (cleanUserData() sets user = {}), so reading
    // getUserDetails().ID afterwards always yields undefined and the
    // ID 1 exemption below could never apply.
    const userId = this.Authentication.getUserDetails().ID;
    const isOAuthLogin = typeof this.Authentication.isOAuthLogin === 'function' ? this.Authentication.isOAuthLogin() : true;

    try {
      await this.Authentication.logout();
    } finally {
      // always clear the kubernetes cache
      dispatchCacheRefreshEvent();

      cleanReturnUrl();
      this.LocalStorage.storeLogoutReason(error);
      if (settings.OAuthLogoutURI && isOAuthLogin && userId !== 1) {
        this.$window.location.href = settings.OAuthLogoutURI;
      } else {
        this.$state.go('portainer.auth', { reload: true });
      }
    }
  }

  logout() {
    return this.$async(this.logoutAsync);
  }

  /**
   * END UTILS FUNCTIONS SECTION
   */

  async onInit() {
    try {
      await this.logout();
    } catch (err) {
      this.Notifications.error('Failure', err, 'An error occurred during logout');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  /**
   * END ON INIT SECTION
   */
}

export default LogoutController;
angular.module('portainer.app').controller('LogoutController', LogoutController);
