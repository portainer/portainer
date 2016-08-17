angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'Config', 'Messages', 'errorMsgFilter',
function ($scope, $state, Network, Config, Messages, errorMsgFilter) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.advancedSettings = false;
  $scope.sortType = 'Name';
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
          var error = errorMsgFilter(d);
          if (error) {
            Messages.send("Error", "Unable to remove network with active endpoints");
          } else {
            Messages.send("Network deleted", network.Id);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e.data);
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

  fetchNetworks();
}]);
