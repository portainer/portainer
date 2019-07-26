import uuidv4 from 'uuid/v4';

angular.module('portainer.app')
.controller('AuthenticationController', ['$async', '$q', '$scope', '$state', '$stateParams', '$sanitize', 'Authentication', 'UserService', 'EndpointService', 'ExtensionService', 'StateManager', 'Notifications', 'SettingsService', 'URLHelper', 'LocalStorage',
function($async, $q, $scope, $state, $stateParams, $sanitize, Authentication, UserService, EndpointService, ExtensionService, StateManager, Notifications, SettingsService, URLHelper, LocalStorage) {
  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: '',
    Password: ''
  };

  $scope.state = {
    AuthenticationError: '',
    isInOAuthProcess: true,
    OAuthProvider: ''
  };

  function retrieveAndSaveEnabledExtensions() {
    return $async(retrieveAndSaveEnabledExtensionsAsync);
  }

  async function retrieveAndSaveEnabledExtensionsAsync() {
    try {
      await ExtensionService.retrieveAndSaveEnabledExtensions();
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to retrieve enabled extensions');
      $scope.state.loginInProgress = false;
    }
  }

  $scope.authenticateUser = function() {
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;
    $scope.state.loginInProgress = true;

    Authentication.login(username, password)
    .then(function success() {
      return retrieveAndSaveEnabledExtensions();
    })
    .then(function () {
      checkForEndpoints();
    })
    .catch(function error() {
      SettingsService.publicSettings()
      .then(function success(settings) {
        if (settings.AuthenticationMethod === 1) {
          return Authentication.login($sanitize(username), $sanitize(password));
        }
        return $q.reject();
      })
      .then(function success() {
        return retrieveAndSaveEnabledExtensions();
      })
      .then(function() {
        $state.go('portainer.updatePassword');
      })
      .catch(function error() {
        $scope.state.AuthenticationError = 'Invalid credentials';
        $scope.state.loginInProgress = false;
      });
    });
  };

  function unauthenticatedFlow() {
    EndpointService.endpoints(0, 100)
    .then(function success(endpoints) {
      if (endpoints.value.length === 0) {
        $state.go('portainer.init.endpoint');
      } else {
        $state.go('portainer.home');
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    });
  }

  function authenticatedFlow() {
    UserService.administratorExists()
    .then(function success(exists) {
      if (!exists) {
        $state.go('portainer.init.admin');
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to verify administrator account existence');
    });
  }

  function checkForEndpoints() {
    EndpointService.endpoints(0, 100)
    .then(function success(data) {
      var endpoints = data.value;

      if (endpoints.length === 0 && Authentication.isAdmin()) {
        $state.go('portainer.init.endpoint');
      } else {
        $state.go('portainer.home');
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
      $scope.state.loginInProgress = false;
    });
  }

  function determineOauthProvider(LoginURI) {
    if (LoginURI.indexOf('login.microsoftonline.com') !== -1) {
      return 'Microsoft';
    }
    else if (LoginURI.indexOf('accounts.google.com') !== -1) {
      return 'Google';
    }
    else if (LoginURI.indexOf('github.com') !== -1) {
      return 'Github';
    }
    return 'OAuth';
  }

  function generateState() {
    if ($scope.state.OAuthProvider !== 'OAuth') {
      return '';
    }
    const uuid = uuidv4();
    LocalStorage.storeLoginStateUUID(uuid);
    return '&state=' + uuid;
  }

  function hasValidState(state) {
    if ($scope.state.OAuthProvider !== 'OAuth') {
      return true;
    }
    const savedUUID = LocalStorage.getLoginStateUUID();
    return savedUUID === state;
  }

  function initView() {
    SettingsService.publicSettings()
    .then(function success(settings) {
      $scope.AuthenticationMethod = settings.AuthenticationMethod;
      $scope.state.OAuthProvider = determineOauthProvider(settings.OAuthLoginURI);
      $scope.OAuthLoginURI = settings.OAuthLoginURI + generateState();
    });

    if ($stateParams.logout || $stateParams.error) {
      Authentication.logout();
      $scope.state.AuthenticationError = $stateParams.error;
      $scope.state.isInOAuthProcess = false;
      return;
    }

    if (Authentication.isAuthenticated()) {
      $state.go('portainer.home');
    }

    var authenticationEnabled = $scope.applicationState.application.authentication;
    if (!authenticationEnabled) {
      unauthenticatedFlow();
    } else {
      authenticatedFlow();
    }

    const code = URLHelper.getParameter('code');
    const state = URLHelper.getParameter('state');
    if (code && hasValidState(state)) {
      oAuthLogin(code);
    } else {
      $scope.state.isInOAuthProcess = false;
    }
  }

  function oAuthLogin(code) {
    return Authentication.OAuthLogin(code)
    .then(function success() {
      return retrieveAndSaveEnabledExtensions();
    })
    .then(function() {
      URLHelper.cleanParameters();
    })
    .catch(function error() {
      $scope.state.AuthenticationError = 'Unable to login via OAuth';
      $scope.state.isInOAuthProcess = false;
    });
  }


  initView();
}]);
