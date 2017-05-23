angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', '$window', '$timeout', '$sanitize', 'Config', 'Authentication', 'Users', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications',
function ($scope, $state, $stateParams, $window, $timeout, $sanitize, Config, Authentication, Users, EndpointService, StateManager, EndpointProvider, Notifications) {

  $scope.authData = {
    username: 'admin',
    password: '',
    error: ''
  };
  $scope.initPasswordData = {
    password: '',
    password_confirmation: '',
    error: false
  };

  if (!$scope.applicationState.application.authentication) {
    EndpointService.endpoints()
    .then(function success(data) {
      if (data.length > 0)  {
        endpointID = EndpointProvider.endpointID();
        if (!endpointID) {
          endpointID = data[0].Id;
          EndpointProvider.setEndpointID(endpointID);
        }
        StateManager.updateEndpointState(true)
        .then(function success() {
          $state.go('dashboard');
        }, function error(err) {
          Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
        });
      }
      else {
        $state.go('endpointInit');
      }
    }, function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    });
  } else {
    Users.checkAdminUser({}, function () {},
    function (e) {
      if (e.status === 404) {
        $scope.initPassword = true;
      } else {
        Notifications.error('Failure', e, 'Unable to verify administrator account existence');
      }
    });
  }

  if ($stateParams.logout) {
    Authentication.logout();
  }

  if ($stateParams.error) {
    $scope.authData.error = $stateParams.error;
    Authentication.logout();
  }

  if (Authentication.isAuthenticated()) {
    $state.go('dashboard');
  }

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
  });

  $scope.createAdminUser = function() {
    var password = $sanitize($scope.initPasswordData.password);
    Users.initAdminUser({password: password}, function (d) {
      $scope.initPassword = false;
      $timeout(function() {
        var element = $window.document.getElementById('password');
        if(element) {
          element.focus();
        }
      });
    }, function (e) {
      $scope.initPassword.error = true;
    });
  };

  $scope.authenticateUser = function() {
    $scope.authenticationError = false;
    var username = $sanitize($scope.authData.username);
    var password = $sanitize($scope.authData.password);
    Authentication.login(username, password)
    .then(function success(data) {
      return EndpointService.endpoints();
    })
    .then(function success(data) {
      var userDetails = Authentication.getUserDetails();
      if (data.length > 0)  {
        endpointID = EndpointProvider.endpointID();
        if (!endpointID) {
          endpointID = data[0].Id;
          EndpointProvider.setEndpointID(endpointID);
        }
        StateManager.updateEndpointState(true)
        .then(function success() {
          $state.go('dashboard');
        }, function error(err) {
          Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
        });
      }
      else if (data.length === 0 && userDetails.role === 1) {
        $state.go('endpointInit');
      } else if (data.length === 0 && userDetails.role === 2) {
        Authentication.logout();
        $scope.authData.error = 'User not allowed. Please contact your administrator.';
      }
    })
    .catch(function error(err) {
      $scope.authData.error = 'Authentication error';
    });
  };
}]);
