angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', '$window', '$timeout', '$sanitize', 'Config', 'Authentication', 'Users', 'EndpointService', 'StateManager', 'Messages',
function ($scope, $state, $stateParams, $window, $timeout, $sanitize, Config, Authentication, Users, EndpointService, StateManager, Messages) {

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
    EndpointService.getActive().then(function success(data) {
      StateManager.updateEndpointState(true)
      .then(function success() {
        $state.go('dashboard');
      }, function error(err) {
        Messages.error("Failure", err, 'Unable to connect to the Docker endpoint');
      });
    }, function error(err) {
      if (err.status === 404) {
        $state.go('endpointInit');
      } else {
        Messages.error("Failure", err, 'Unable to verify Docker endpoint existence');
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

  Users.checkAdminUser({}, function (d) {},
  function (e) {
    if (e.status === 404) {
      $scope.initPassword = true;
    } else {
      Messages.error("Failure", e, 'Unable to verify administrator account existence');
    }
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
    Authentication.login(username, password).then(function success() {
      EndpointService.getActive().then(function success(data) {
        StateManager.updateEndpointState(true)
        .then(function success() {
          $state.go('dashboard');
        }, function error(err) {
          Messages.error("Failure", err, 'Unable to connect to the Docker endpoint');
        });
      }, function error(err) {
        if (err.status === 404) {
          $state.go('endpointInit');
        } else {
          Messages.error("Failure", err, 'Unable to verify Docker endpoint existence');
        }
      });
    }, function error() {
      $scope.authData.error = 'Invalid credentials';
    });
  };
}]);
