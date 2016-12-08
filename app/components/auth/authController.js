angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', '$window', '$timeout', '$sanitize', 'Config', 'Authentication', 'Users', 'Messages',
function ($scope, $state, $stateParams, $window, $timeout, $sanitize, Config, Authentication, Users, Messages) {

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

  if ($stateParams.logout) {
    Authentication.logout();
  }

  if ($stateParams.error) {
    $scope.authData.error = $stateParams.error;
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
    var password = $sanitize($scope.initPasswordData.password);
    Users.create({username: "admin", password: password}, function (d) {
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
    .then(function() {
      $state.go('dashboard');
    }, function() {
      $scope.authData.error = 'Invalid credentials';
    });
  };
}]);
