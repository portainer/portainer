angular.module('endpoint', [])
.controller('EndpointController', ['$scope', '$stateParams',
function ($scope, $stateParams) {
  $scope.endpoint = {
    Id: 'test',
    Name: 'endpoint_name'
  };
}]);
