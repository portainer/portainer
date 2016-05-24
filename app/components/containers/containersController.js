angular.module('containers', [])
  .controller('ContainersController', ['$scope', 'Container', 'Settings', 'Messages', 'ViewSpinner',
  function ($scope, Container, Settings, Messages, ViewSpinner) {

  $scope.state = {};
  $scope.state.displayAll = Settings.displayAll;
  $scope.sortType = 'Created';
  $scope.sortReverse = true;
  $scope.state.toggle = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var update = function (data) {
    ViewSpinner.spin();
    Container.query(data, function (d) {
      $scope.containers = d.filter(function (container) {
        return container.Image !== 'swarm';
      }).map(function (container) {
        return new ContainerViewModel(container);
      });
      ViewSpinner.stop();
    });
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredContainers, function (i) {
      i.Checked = $scope.state.toggle;
    });
  };

  $scope.toggleGetAll = function () {
    Settings.displayAll = $scope.state.displayAll;
    update({all: Settings.displayAll ? 1 : 0});
  };

  update({all: Settings.displayAll ? 1 : 0});
}]);
