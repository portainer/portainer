angular.module('volumes', [])
.controller('VolumesController', ['$scope', 'Volume', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
function ($scope, Volume, ViewSpinner, Messages, $route, errorMsgFilter) {
  $scope.state = {};
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredVolumes, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  function fetchVolumes() {
    ViewSpinner.spin();
    Volume.query({}, function (d) {
      $scope.volumes = d.Volumes;
      ViewSpinner.stop();
    }, function (e) {
      Messages.error("Failure", e.data);
      ViewSpinner.stop();
    });
  }
  fetchVolumes();
}]);
