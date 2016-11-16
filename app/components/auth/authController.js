angular.module('auth', [])
.controller('AuthenticationController', ['$scope', 'Config',
function ($scope, Config) {

  Config.$promise.then(function (c) {
  });
}]);
