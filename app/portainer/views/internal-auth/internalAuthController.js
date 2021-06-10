import angular from 'angular';

class InternalAuthenticationController {
  /* @ngInject */
  constructor(
    $async,
    $scope,
    $state,
    $stateParams,
    $window,
    Authentication,
    UserService,
    EndpointService,
    StateManager,
    Notifications,
    LocalStorage,
    StatusService,
    LicenseService
  ) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$window = $window;
    this.Authentication = Authentication;
    this.UserService = UserService;
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;
    this.Notifications = Notifications;
    this.LocalStorage = LocalStorage;
    this.StatusService = StatusService;
    this.LicenseService = LicenseService;
    this.logo = this.StateManager.getState().application.logo;
    this.formValues = {
      Username: '',
      Password: '',
    };
    this.state = {
      AuthenticationError: '',
      loginInProgress: true,
    };

    this.checkForEndpointsAsync = this.checkForEndpointsAsync.bind(this);
    this.checkForLicensesAsync = this.checkForLicensesAsync.bind(this);
    this.postLoginSteps = this.postLoginSteps.bind(this);
    this.internalLoginAsync = this.internalLoginAsync.bind(this);
    this.authenticateUserAsync = this.authenticateUserAsync.bind(this);
    this.authEnabledFlowAsync = this.authEnabledFlowAsync.bind(this);
    this.onInit = this.onInit.bind(this);
  }

  /**
   * UTILS FUNCTIONS SECTION
   */

  logout(error) {
    this.Authentication.logout();
    this.state.loginInProgress = false;
    this.LocalStorage.storeLogoutReason(error);
    this.$window.location.reload();
  }

  error(err, message) {
    this.state.AuthenticationError = message;
    if (!err) {
      err = {};
    }
    this.Notifications.error('Failure', err, message);
    this.state.loginInProgress = false;
  }

  /**
   * END UTILS FUNCTIONS SECTION
   */

  /**
   * POST LOGIN STEPS SECTION
   */

  async checkForEndpointsAsync() {
    try {
      const endpoints = await this.EndpointService.endpoints(0, 1);

      if (endpoints.value.length === 0) {
        return 'portainer.init.endpoint';
      }
    } catch (err) {
      this.error(err, 'Unable to retrieve endpoints');
    }
    return 'portainer.home';
  }

  async checkForLicensesAsync() {
    try {
      const info = await this.LicenseService.info();

      if (!info.valid) {
        return 'portainer.init.license';
      }
    } catch (err) {
      this.error(err, 'Unable to retrieve licenses info');
    }
  }

  async postLoginSteps() {
    await this.StateManager.initialize();

    const isAdmin = this.Authentication.isAdmin();
    let path = 'portainer.home';
    if (isAdmin) {
      path = await this.checkForLicensesAsync();
      if (!path) {
        path = await this.checkForEndpointsAsync();
      }
    }

    this.$state.go(path);
  }
  /**
   * END POST LOGIN STEPS SECTION
   */

  /**
   * LOGIN METHODS SECTION
   */

  async internalLoginAsync(username, password) {
    await this.Authentication.login(username, password);
    await this.postLoginSteps();
  }

  /**
   * END LOGIN METHODS SECTION
   */

  /**
   * AUTHENTICATE USER SECTION
   */

  async authenticateUserAsync() {
    try {
      var username = this.formValues.Username;
      var password = this.formValues.Password;
      this.state.loginInProgress = true;
      await this.internalLoginAsync(username, password);
    } catch (err) {
      this.error(err, 'Unable to login');
    }
  }

  authenticateUser() {
    return this.$async(this.authenticateUserAsync);
  }

  /**
   * END AUTHENTICATE USER SECTION
   */

  /**
   * ON INIT SECTION
   */

  async authEnabledFlowAsync() {
    try {
      const exists = await this.UserService.administratorExists();
      if (!exists) {
        this.$state.go('portainer.init.admin');
      }
    } catch (err) {
      this.error(err, 'Unable to verify administrator account existence');
    }
  }

  async onInit() {
    if (this.$stateParams.logout || this.$stateParams.error) {
      this.logout(this.$stateParams.error);
      return;
    }

    const error = this.LocalStorage.getLogoutReason();
    if (error) {
      this.state.AuthenticationError = error;
      this.LocalStorage.cleanLogoutReason();
    }

    this.state.loginInProgress = false;

    await this.authEnabledFlowAsync();
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  /**
   * END ON INIT SECTION
   */
}

export default InternalAuthenticationController;
angular.module('portainer.app').controller('InternalAuthenticationController', InternalAuthenticationController);
