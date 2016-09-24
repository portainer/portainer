angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'Config', 'Messages',
function ($scope, $state, Network, Config, Messages) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.advancedSettings = false;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.config = {
    Name: ''
  };

  function prepareNetworkConfiguration() {
    var config = angular.copy($scope.config);
    if ($scope.swarm) {
      config.Driver = 'overlay';
      // Force IPAM Driver to 'default', should not be required.
      // See: https://github.com/docker/docker/issues/25735
      config.IPAM = {
        Driver: 'default'
      };
    }
    return config;
  }

  $scope.createNetwork = function() {
    $('#createNetworkSpinner').show();
    var config = prepareNetworkConfiguration();
    Network.create(config, function (d) {
      if (d.message) {
        $('#createNetworkSpinner').hide();
        Messages.error('Unable to create network', {}, d.message);
      } else {
        Messages.send("Network created", d.Id);
        $('#createNetworkSpinner').hide();
        $state.go('networks', {}, {reload: true});
      }
    }, function (e) {
      $('#createNetworkSpinner').hide();
      Messages.error("Failure", e, 'Unable to create network');
    });
  };

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

  $scope.removeAction = function () {
    $('#loadNetworksSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadNetworksSpinner').hide();
      }
    };
    angular.forEach($scope.networks, function (network) {
      if (network.Checked) {
        counter = counter + 1;
        Network.remove({id: network.Id}, function (d) {
          if (d.message) {
            Messages.send("Error", d.message);
          } else {
            Messages.send("Network removed", network.Id);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, 'Unable to remove network');
          complete();
        });
      }
    });
  };

  function fetchNetworks() {
    $('#loadNetworksSpinner').show();
    Network.query({}, function (d) {
      $scope.networks = d;
      $('#loadNetworksSpinner').hide();
    }, function (e) {
      $('#loadNetworksSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve networks");
    });
  }

  Config.$promise.then(function (c) {
    $scope.swarm = c.swarm;
    fetchNetworks();
  });
}]);
