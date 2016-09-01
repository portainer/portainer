angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'Config', 'Messages', 'errorMsgFilter',
function ($scope, $state, Network, Config, Messages, errorMsgFilter) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.advancedSettings = false;
  $scope.sortType = 'Scope';
  $scope.sortReverse = false;

  $scope.formValues = {
    Subnet: '',
    Gateway: ''
  };

  $scope.config = {
    Name: '',
    IPAM: {
      Config: []
    }
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

  function prepareIPAMConfiguration(config) {
    if ($scope.formValues.Subnet) {
      var ipamConfig = {};
      ipamConfig.Subnet = $scope.formValues.Subnet;
      if ($scope.formValues.Gateway) {
        ipamConfig.Gateway = $scope.formValues.Gateway  ;
      }
      config.IPAM.Config.push(ipamConfig);
    }
  }

  function prepareNetworkConfiguration() {
    var config = angular.copy($scope.config);
    prepareIPAMConfiguration(config);
    if ($scope.swarm) {
      config.Driver = 'overlay';
    }
    return config;
  }

  $scope.createNetwork = function() {
    $('#createNetworkSpinner').show();
    var config = prepareNetworkConfiguration();
    Network.create(config, function (d) {
      if (d.Id) {
        Messages.send("Network created", d.Id);
        $('#createNetworkSpinner').hide();
        $state.go('networks', {}, {reload: true});
      } else {
        $('#createNetworkSpinner').hide();
        Messages.error('Unable to create network', errorMsgFilter(d));
      }
    }, function (e) {
      $('#createNetworkSpinner').hide();
      Messages.error('Unable to create network', e.data);
    });
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
          if (e.data.message) {
            Messages.error("Failure", e.data.message);
          } else {
            Messages.error("Failure", 'Unable to remove network');
          }
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
      Messages.error("Failure", e.data);
      $('#loadNetworksSpinner').hide();
    });
  }

  Config.$promise.then(function (c) {
    $scope.swarm = c.swarm;
    fetchNetworks();
  });
}]);
