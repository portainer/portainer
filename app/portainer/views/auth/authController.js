angular.module('portainer.app')
.controller('AuthenticationController', 
['$scope', '$state', '$transition$', 'Authentication', 'UserService', 'EndpointService', 'StateManager', 'Notifications', 'SettingsService', '$sanitize',
function ($scope, $state, $transition$, Authentication, UserService, EndpointService, StateManager, Notifications, SettingsService, $sanitize) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: '',
    Password: '',
    changePassword: false
  };

  $scope.state = {
    AuthenticationError: ''
  };

  function unauthenticatedFlow() {
    EndpointService.endpoints()
    .then(function success(endpoints) {
      if (endpoints.length === 0) {
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

  $scope.authenticateUser = function() {
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;

    SettingsService.publicSettings()
    .then(function success() {
      if ($scope.formValues.changePassword) {
        password = $sanitize(password);
      }
      return Authentication.login(username, password);
    })
    .then(function onSuccesfulLogin() {
      if ($scope.formValues.changePassword) {
        return $state.go('portainer.account');
      }
      return EndpointService.endpoints()
      .then(function onEndpointsLoaded(endpoints) {
          var userDetails = Authentication.getUserDetails();
          if (endpoints.length === 0 && userDetails.role === 1) {
            return $state.go('portainer.init.endpoint');
          }
          return $state.go('portainer.home');
        });
    })
    .catch(function error() {
      $scope.state.AuthenticationError = 'Invalid credentials';
    });
  };

  function initView() {
    if ($transition$.params().logout || $transition$.params().error) {
      Authentication.logout();
      $scope.state.AuthenticationError = $transition$.params().error;
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
  }

  initView();
}]);
