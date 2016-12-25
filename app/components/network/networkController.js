angular.module('network', [])
.controller('NetworkController', ['$scope', '$state', '$stateParams', 'Network', 'Container', 'ContainerHelper', 'Messages',
function ($scope, $state, $stateParams, Network, Container, ContainerHelper, Messages) {

  $scope.removeNetwork = function removeNetwork(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Messages.send("Network removed", $stateParams.id);
        $state.go('networks', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to remove network");
    });
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(network, containerId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: $stateParams.id}, { Container: containerId, Force: false }, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Messages.send("Container left network", $stateParams.id);
        $state.go('network', {id: network.Id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to disconnect container from network");
    });
  };

  function getNetwork() {
    $('#loadingViewSpinner').show();
    Network.get({id: $stateParams.id}, function (d) {
      $scope.network = d;
      getContainersInNetwork(d);
      $('#loadingViewSpinner').hide();
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve network info");
    });
  }

  function getContainersInNetwork(network) {
    if (network.Containers) {
      Container.query({
        filters: {network: [$stateParams.id]}
      }, function (containersInNetworkResult) {
        if ($scope.containersToHideLabels) {
          containersInNetworkResult = ContainerHelper.hideContainers(containersInNetworkResult, $scope.containersToHideLabels);
        }
        var containersInNetwork = [];
        containersInNetworkResult.forEach(function(container) {
          var containerInNetwork = network.Containers[container.Id];
          containerInNetwork.Id = container.Id;
          containersInNetwork.push(containerInNetwork);
        });
        $scope.containersInNetwork = containersInNetwork;
      });
    }
  }

  getNetwork();
}]);
