import _ from 'lodash-es';

angular.module('portainer.docker')
.controller('NetworksController', ['$q', '$scope', '$state', 'NetworkService', 'Notifications', 'HttpRequestHelper', 'EndpointProvider', 'AgentService',
function ($q, $scope, $state, NetworkService, Notifications, HttpRequestHelper, EndpointProvider, AgentService) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (network) {
      HttpRequestHelper.setPortainerAgentTargetHeader(network.NodeName);
      NetworkService.remove(network.Id)
      .then(function success() {
        Notifications.success('Network successfully removed', network.Name);
        var index = $scope.networks.indexOf(network);
        $scope.networks.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove network');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.offlineMode = false;

  $scope.getNetworks = getNetworks;

  function groupSwarmNetworksManagerNodesFirst(networks, agents) {
    const getRole = (item) => _.find(agents, (agent) => agent.NodeName === item.NodeName).NodeRole;

    const nonSwarmNetworks = _.remove(networks, (item) => item.Scope !== 'swarm')
    const grouped = _.toArray(_.groupBy(networks, (item) => item.Id));
    const sorted = _.map(grouped, (arr) => _.sortBy(arr, (item) => getRole(item)));
    const arr = _.map(sorted, (a) => {
      const item = a[0];
      for (let i = 1; i < a.length; i++) {
        item.Subs.push(a[i]);
      }
      return item;
    });
    const res = _.concat(arr, ...nonSwarmNetworks);
    return res;
  }

  function getNetworks() {
    const req = {
      networks: NetworkService.networks(true, true, true)
    };

    if ($scope.applicationState.endpoint.mode.agentProxy && $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
      req.agents = AgentService.agents();
    }

    $q.all(req)
    .then((data) => {
      $scope.offlineMode = EndpointProvider.offlineMode();
      const networks = _.forEach(data.networks, (item) => item.Subs = []);
      if ($scope.applicationState.endpoint.mode.agentProxy && $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
        $scope.networks = groupSwarmNetworksManagerNodesFirst(data.networks, data.agents);
      } else {
        $scope.networks = networks;
      }
    })
    .catch((err) => {
      $scope.networks = [];
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    });
  }

  function initView() {
    getNetworks();
  }

  initView();
}]);
