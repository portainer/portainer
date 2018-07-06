angular.module('portainer.app')
.controller('AuthenticationController', ['$scope', '$state', '$transition$', '$window', '$timeout', '$sanitize', 'Authentication', 'Users', 'UserService', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications', 'SettingsService', 'ExtensionManager',
function ($scope, $state, $transition$, $window, $timeout, $sanitize, Authentication, Users, UserService, EndpointService, StateManager, EndpointProvider, Notifications, SettingsService, ExtensionManager) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: '',
    Password: ''
  };

  $scope.state = {
    AuthenticationError: ''
  };

  // function redirectToDockerDashboard(endpoint) {
  //   ExtensionManager.initEndpointExtensions(endpoint.Id)
  //   .then(function success(data) {
  //     var extensions = data;
  //     return StateManager.updateEndpointState(true, endpoint.Type, extensions);
  //   })
  //   .then(function success(data) {
  //     $state.go('portainer.home');
  //   })
  //   .catch(function error(err) {
  //     Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
  //   });
  // }
  //
  // function redirectToAzureDashboard(endpoint) {
  //   StateManager.updateEndpointState(false, endpoint.Type, [])
  //   .then(function success(data) {
  //     $state.go('portainer.home');
  //   })
  //   .catch(function error(err) {
  //     Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
  //   });
  // }

  // function redirectToDashboard(endpoint) {
  //   EndpointProvider.setEndpointID(endpoint.Id);
  //
  //   if (endpoint.Type === 3) {
  //     return redirectToAzureDashboard(endpoint);
  //   }
  //   redirectToDockerDashboard(endpoint);
  // }

  function unauthenticatedFlow() {
    EndpointService.endpoints()
    .then(function success(data) {
      // var endpoints = data;
      // if (endpoints.length > 0)  {
      //   redirectToDashboard(endpoints[0]);
      // } else {
      //   $state.go('portainer.init.endpoint');
      // }

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
      if (endpoints.length === 0 && userDetails.role === 1) {
        $state.go('portainer.init.endpoint');
      } else {
        $state.go('portainer.home');
      }

      // if (endpoints.length > 0)  {
      //   redirectToDashboard(endpoints[0]);
      // } else if (endpoints.length === 0 && userDetails.role === 1) {
      //   $state.go('portainer.init.endpoint');
      // } else if (endpoints.length === 0 && userDetails.role === 2) {
      //   Authentication.logout();
      //   $scope.state.AuthenticationError = 'User not allowed. Please contact your administrator.';
      // }
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
