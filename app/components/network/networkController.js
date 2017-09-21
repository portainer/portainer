angular.module('network', [])
.controller('NetworkController', ['$scope', '$state', '$uiRouterGlobals', '$filter', 'Network', 'NetworkService', 'Container', 'ContainerHelper', 'Notifications',
function ($scope, $state, $uiRouterGlobals, $filter, Network, NetworkService, Container, ContainerHelper, Notifications) {

  $scope.removeNetwork = function removeNetwork(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $uiRouterGlobals.params.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Unable to remove network');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Network removed', $uiRouterGlobals.params.id);
        $state.go('networks', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Unable to remove network');
    });
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(network, containerId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: $uiRouterGlobals.params.id}, { Container: containerId, Force: false }, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Unable to disconnect container from network');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Container left network', $uiRouterGlobals.params.id);
        $state.go('network', {id: network.Id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Unable to disconnect container from network');
    });
  };

  function filterContainersInNetwork(network, containers) {
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
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Notifications.error('Failure', err, 'Unable to retrieve containers in network');
        });
      } else {
        Container.query({
          filters: {network: [$uiRouterGlobals.params.id]}
        }, function success(data) {
          filterContainersInNetwork(network, data);
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Notifications.error('Failure', err, 'Unable to retrieve containers in network');
        });
      }
    }
  }

  function initView() {
    $('#loadingViewSpinner').show();
    NetworkService.network($uiRouterGlobals.params.id)
    .then(function success(data) {
      $scope.network = data;
      var endpointProvider = $scope.applicationState.endpoint.mode.provider;
      if (endpointProvider !== 'VMWARE_VIC') {
        getContainersInNetwork(data);
      }
    })
    .catch(function error(err) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', err, 'Unable to retrieve network info');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
