angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', 'Config', 'Authentication', 'Users', 'Messages',
function ($scope, $state, $stateParams, Config, Authentication, Users, Messages) {

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

  Users.query({}, function (d) {
    if (_.isEmpty(d)) {
      $scope.initPassword = true;
    }
  }, function (e) {
    Messages.error("Failure", e, 'Unable to load existing users');
  });

  $scope.createAdminUser = function() {
    Users.create({username: "admin", password: $scope.initPasswordData.password}, function (d) {
      $scope.initPassword = false;
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
