angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'ViewSpinner', 'Messages', 'errorMsgFilter',
function ($scope, $state, Network, ViewSpinner, Messages, errorMsgFilter) {
  $scope.state = {};
  $scope.state.toggle = false;
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Scope';
  $scope.sortReverse = false;

  $scope.config = {
    Name: ''
  };

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

  function prepareNetworkConfiguration() {
    var config = angular.copy($scope.config);
    config.Driver = 'overlay';
    return config;
  }

  $scope.createNetwork = function() {
    ViewSpinner.spin();
    var config = prepareNetworkConfiguration();
    Network.create(config, function (d) {
      if (d.Id) {
        Messages.send("Network created", d.Id);
        ViewSpinner.stop();
        $state.go('networks', {}, {reload: true});
      } else {
        ViewSpinner.stop();
        Messages.error('Unable to create network', errorMsgFilter(d));
      }
    }, function (e) {
      ViewSpinner.stop();
      Messages.error('Unable to create network', e.data);
    });
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
