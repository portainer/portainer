angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', '$window', '$timeout', 'Config', 'Authentication', 'Users', 'Messages',
function ($scope, $state, $stateParams, $window, $timeout, Config, Authentication, Users, Messages) {

  $scope.authData = {
    username: 'admin',
    password: '',
    error: false
  };
  $scope.initPasswordData = {
    password: '',
    password_confirmation: '',
    error: false
  };

  if ($stateParams.logout) {
    Authentication.logout();
  }

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
  });

  Users.get({username: "admin"}, function (d) {},
  function (e) {
    if (e.status === 404) {
      $scope.initPassword = true;
    } else {
      Messages.error("Failure", e, 'Unable to load existing users');
    }
  });

  $scope.createAdminUser = function() {
    Users.create({username: "admin", password: $scope.initPasswordData.password}, function (d) {
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
    Authentication.login($scope.authData.username, $scope.authData.password)
    .then(function() {
      $state.go('dashboard');
    }, function() {
      $scope.authData.error = true;
    });
  };
}]);
