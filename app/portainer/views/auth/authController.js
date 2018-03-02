angular.module('portainer.app')
.controller('AuthenticationController', ['$scope', '$state', '$transition$', '$window', '$timeout', '$sanitize', 'Authentication', 'Users', 'UserService', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications', 'SettingsService',
function ($scope, $state, $transition$, $window, $timeout, $sanitize, Authentication, Users, UserService, EndpointService, StateManager, EndpointProvider, Notifications, SettingsService) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: '',
    Password: ''
  };

  $scope.state = {
    AuthenticationError: ''
  };

  function setActiveEndpointAndRedirectToDashboard(endpoint) {
    var endpointID = EndpointProvider.endpointID();
    if (!endpointID) {
      EndpointProvider.setEndpointID(endpoint.Id);
    }
    StateManager.updateEndpointState(true, endpoint.Extensions)
    .then(function success(data) {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    });
  }

  function unauthenticatedFlow() {
    EndpointService.endpoints()
    .then(function success(data) {
      var endpoints = data;
      if (endpoints.length > 0)  {
        setActiveEndpointAndRedirectToDashboard(endpoints[0]);
      } else {
        $state.go('portainer.init.endpoint');
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
    .then(function success(data) {
      var settings = data;
      if (settings.AuthenticationMethod === 1) {
        username = $sanitize(username);
        password = $sanitize(password);
      }
      return Authentication.login(username, password);
    })
    .then(function success() {
      return EndpointService.endpoints();
    })
    .then(function success(data) {
      var endpoints = data;
      var userDetails = Authentication.getUserDetails();
      if (endpoints.length > 0)  {
        setActiveEndpointAndRedirectToDashboard(endpoints[0]);
      } else if (endpoints.length === 0 && userDetails.role === 1) {
        $state.go('portainer.init.endpoint');
      } else if (endpoints.length === 0 && userDetails.role === 2) {
        Authentication.logout();
        $scope.state.AuthenticationError = 'User not allowed. Please contact your administrator.';
      }
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
      $state.go('docker.dashboard');
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
