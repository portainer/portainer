angular.module('user', [])
.controller('UserController', ['$scope', '$state', '$stateParams', 'Messages',
function ($scope, $state, $stateParams, Messages) {

  function getNetwork() {
    $scope.user = {
      Id: 1,
      Username: "okenobi",
      Role: "administrator"
    };
  }

  getNetwork();
}]);
