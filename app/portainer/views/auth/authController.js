angular.module('portainer.app').controller('AuthenticationController', ['$q', '$scope', '$state', '$stateParams', '$sanitize', 'Authentication', 'UserService', 'EndpointService', 'StateManager', 'Notifications', 'SettingsService', 'URLHelper',
  function($q, $scope, $state, $stateParams, $sanitize, Authentication, UserService, EndpointService, StateManager, Notifications, SettingsService, URLHelper) {
    $scope.logo = StateManager.getState().application.logo;

    $scope.formValues = {
      Username: '',
      Password: ''
    };

    $scope.state = {
      AuthenticationError: '',
      isInOAuthProcess: true
    };

    $scope.authenticateUser = function() {
      var username = $scope.formValues.Username;
      var password = $scope.formValues.Password;

      Authentication.login(username, password)
        .then(function success() {
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
              $state.go('portainer.updatePassword');
            })
            .catch(function error() {
              $scope.state.AuthenticationError = 'Invalid credentials';
            });
        });
    };

    function unauthenticatedFlow() {
      EndpointService.endpoints()
        .then(function success(endpoints) {
          if (endpoints.length === 0) {
            $state.go('portainer.init.endpoint');
          } else {
            $state.go($stateParams.redirect || 'portainer.home');
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
      EndpointService.endpoints()
        .then(function success(data) {
          var endpoints = data;
          var userDetails = Authentication.getUserDetails();

          if (endpoints.length === 0 && userDetails.role === 1) {
            $state.go('portainer.init.endpoint');
          } else {
            $state.go($stateParams.redirect || 'portainer.home');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve endpoints');
        });
    }

    function initView() {
      SettingsService.publicSettings()
        .then(function success(settings) {
          $scope.AuthenticationMethod = settings.AuthenticationMethod;
          $scope.OAuthLoginURI = settings.OAuthLoginURI;
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

      var code = URLHelper.getParameter('code');
      if (code) {
        oAuthLogin(code);
      } else {
        $scope.state.isInOAuthProcess = false;
      }
    }

    function oAuthLogin(code) {
      return Authentication.OAuthLogin(code)
        .then(function success() {
          URLHelper.cleanParameters();
          $state.go('portainer.home');
        })
        .catch(function error() {
          $scope.state.AuthenticationError = 'Unable to login via OAuth';
          $scope.state.isInOAuthProcess = false;
        });
    }


    initView();
  }]);
