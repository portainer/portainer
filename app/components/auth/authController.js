angular.module('auth', [])
.controller('AuthenticationController', ['$scope', '$state', '$stateParams', 'Config', 'Authentication',
function ($scope, $state, $stateParams, Config, Authentication) {

  $scope.username = '';
  $scope.password = '';
  $scope.authenticationError = false;

  if ($stateParams.logout) {
    Authentication.logout();
  }

  Config.$promise.then(function (c) {
  });

  $scope.authenticateUser = function() {
    $scope.authenticationError = false;
    Authentication.login($scope.username, $scope.password)
    .then(function() {
      $state.go('dashboard');
    }, function() {
      $scope.authenticationError = true;
    });
  };
}]);
