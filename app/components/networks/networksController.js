angular.module('networks', [])
.controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
function ($scope, Network, ViewSpinner, Messages, $route, errorMsgFilter) {

  $scope.state = {};
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredNetworks, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  function fetchNetworks() {
    ViewSpinner.spin();
    Network.query({}, function (d) {
      $scope.networks = d;
      ViewSpinner.stop();
    }, function (e) {
      Messages.error("Failure", e.data);
      ViewSpinner.stop();
    });
  }
  fetchNetworks();
}]);
