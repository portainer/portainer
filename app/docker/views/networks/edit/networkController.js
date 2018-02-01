angular.module('portainer.docker')
.controller('NetworkController', ['$scope', '$state', '$transition$', '$filter', 'Network', 'NetworkService', 'Container', 'ContainerHelper', 'Notifications',
function ($scope, $state, $transition$, $filter, Network, NetworkService, Container, ContainerHelper, Notifications) {

  $scope.removeNetwork = function removeNetwork(networkId) {
    Network.remove({id: $transition$.params().id}, function (d) {
      if (d.message) {
        Notifications.error('Error', d, 'Unable to remove network');
      } else {
        Notifications.success('Network removed', $transition$.params().id);
        $state.go('docker.networks', {});
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to remove network');
    });
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(network, containerId) {
    Network.disconnect({id: $transition$.params().id}, { Container: containerId, Force: false }, function (d) {
      if (d.message) {
        Notifications.error('Error', d, 'Unable to disconnect container from network');
      } else {
        Notifications.success('Container left network', $transition$.params().id);
        $state.go('docker.networks.network', {id: network.Id}, {reload: true});
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to disconnect container from network');
    });
  };

  function filterContainersInNetwork(network, containers) {
    var containersInNetwork = [];
    containers.forEach(function(container) {
      var containerInNetwork = network.Containers[container.Id];
      if (containerInNetwork) {
        containerInNetwork.Id = container.Id;
        // Name is not available in Docker 1.9
        if (!containerInNetwork.Name) {
          containerInNetwork.Name = $filter('trimcontainername')(container.Names[0]);
        }
        containersInNetwork.push(containerInNetwork);
      }
    });
    $scope.containersInNetwork = containersInNetwork;
  }

  function getContainersInNetwork(network) {
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    if (network.Containers) {
      if (apiVersion < 1.24) {
        Container.query({}, function success(data) {
          var containersInNetwork = data.filter(function filter(container) {
            if (container.HostConfig.NetworkMode === network.Name) {
              return container;
            }
          });
          filterContainersInNetwork(network, containersInNetwork);
        }, function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve containers in network');
        });
      } else {
        Container.query({
          filters: { network: [$transition$.params().id] }
        }, function success(data) {
          filterContainersInNetwork(network, data);
        }, function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve containers in network');
        });
      }
    }
  }

  function initView() {
    NetworkService.network($transition$.params().id)
    .then(function success(data) {
      $scope.network = data;
      var endpointProvider = $scope.applicationState.endpoint.mode.provider;
      if (endpointProvider !== 'VMWARE_VIC') {
        getContainersInNetwork(data);
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve network info');
    });
  }

  initView();
}]);
