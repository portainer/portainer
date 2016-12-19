angular.module('endpoints', [])
.controller('EndpointsController', ['$scope', 'Settings',
function ($scope, Settings) {
  $scope.state = {};
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.pagination_count = Settings.pagination_count;

  $scope.formValues = {
  };

  $scope.endpoints = [
    {
      Name: "docker-prod01",
      URL: "23.239.34.54:3475",
      Checked: false
    },
    {
      Name: "docker-prod02",
      URL: "23.239.34.55:3475",
      Checked: false
    },
    {
      Name: "docker-staging01",
      URL: "dockerhost.mycustomdomain.com:2375",
      Checked: false
    }
  ];

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };
}]);
