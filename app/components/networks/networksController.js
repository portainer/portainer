angular.module('networks', [])
.controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
function ($scope, Network, ViewSpinner, Messages, $route, errorMsgFilter) {

  $scope.state = {};
  $scope.state.toggle = false;
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Name';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredNetworks, function (i) {
      i.Checked = $scope.state.toggle;
    });
    if ($scope.state.toggle) {
      $scope.state.selectedItemCount = $scope.state.filteredNetworks.length;
    } else {
      $scope.state.selectedItemCount = 0;
    }
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function () {
    ViewSpinner.spin();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        ViewSpinner.stop();
      }
    };
    angular.forEach($scope.networks, function (network) {
      if (network.Checked) {
        counter = counter + 1;
        Network.remove({id: network.Id}, function (d) {
          Messages.send("Network deleted", network.Id);
          var index = $scope.networks.indexOf(network);
          $scope.networks.splice(index, 1);
          complete();
        }, function (e) {
          Messages.error("Failure", e.data);
          complete();
        });
      }
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
