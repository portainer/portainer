angular.module('docker', [])
.controller('DockerController', ['$scope', 'Info', 'Version', 'Settings',
function ($scope, Info, Version, Settings) {

  $scope.info = {};
  $scope.docker = {};
  
  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  Version.get({}, function (d) {
    $scope.docker = d;
  });
  Info.get({}, function (d) {
    $scope.info = d;
  });
}]);
