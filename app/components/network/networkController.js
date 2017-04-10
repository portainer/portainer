angular.module('network', [])
.controller('NetworkController', ['$scope', '$state', '$stateParams', '$filter', 'Config', 'Network', 'Container', 'ContainerHelper', 'Messages',
function ($scope, $state, $stateParams, $filter, Config, Network, Container, ContainerHelper, Messages) {

  $scope.removeNetwork = function removeNetwork(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.error("Error", d, "Unable to remove network");
      } else {
        $('#loadingViewSpinner').hide();
        Messages.success("Network removed", $stateParams.id);
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
        Messages.error("Error", d, "Unable to disconnect container from network");
      } else {
        $('#loadingViewSpinner').hide();
        Messages.success("Container left network", $stateParams.id);
        $state.go('network', {id: network.Id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to disconnect container from network");
    });
  };

  function getNetwork() {
    $('#loadingViewSpinner').show();
    Network.get({id: $stateParams.id}, function success(data) {
      $scope.network = data;
      getContainersInNetwork(data);
    }, function error(err) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", err, "Unable to retrieve network info");
    });
  }

  function filterContainersInNetwork(network, containers) {
    if ($scope.containersToHideLabels) {
      containers = ContainerHelper.hideContainers(containers, $scope.containersToHideLabels);
    }
    var containersInNetwork = [];
    containers.forEach(function(container) {
      var containerInNetwork = network.Containers[container.Id];
      containerInNetwork.Id = container.Id;
      // Name is not available in Docker 1.9
      if (!containerInNetwork.Name) {
        containerInNetwork.Name = $filter('trimcontainername')(container.Names[0]);
      }
      containersInNetwork.push(containerInNetwork);
    });
    $scope.containersInNetwork = containersInNetwork;
  }

  function getContainersInNetwork(network) {
    if (network.Containers) {
      if ($scope.applicationState.endpoint.apiVersion < 1.24) {
        Container.query({}, function success(data) {
          var containersInNetwork = data.filter(function filter(container) {
            if (container.HostConfig.NetworkMode === network.Name) {
              return container;
            }
          });
          filterContainersInNetwork(network, containersInNetwork);
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Messages.error("Failure", err, "Unable to retrieve containers in network");
        });
      } else {
        Container.query({
          filters: {network: [$stateParams.id]}
        }, function success(data) {
          filterContainersInNetwork(network, data);
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Messages.error("Failure", err, "Unable to retrieve containers in network");
        });
      }
    }
  }

  Config.$promise.then(function (c) {
    $scope.containersToHideLabels = c.hiddenLabels;
    getNetwork();
  });
}]);
