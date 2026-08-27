import _ from 'lodash-es';
import DockerNetworkHelper from '@/docker/helpers/networkHelper';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';

import { groupSwarmNetworksManagerNodesFirst } from './groupSwarmNetworks';

angular.module('portainer.docker').controller('NetworksController', [
  '$q',
  '$scope',
  '$state',
  'NetworkService',
  'Notifications',
  'HttpRequestHelper',
  'endpoint',
  'AgentService',
  function ($q, $scope, $state, NetworkService, Notifications, HttpRequestHelper, endpoint, AgentService) {
    $scope.removeAction = async function (selectedItems) {
      async function doRemove(network) {
        HttpRequestHelper.setPortainerAgentTargetHeader(network.NodeName);
        return NetworkService.remove(network.Id)
          .then(function success() {
            Notifications.success('Network successfully removed', network.Name);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove network');
          });
      }

      await processItemsInBatches(selectedItems, doRemove);
      $state.reload();
    };

    $scope.getNetworks = getNetworks;

    function getNetworks() {
      const req = {
        networks: NetworkService.networks(true, true, true),
      };

      if ($scope.applicationState.endpoint.mode.agentProxy && $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
        req.agents = AgentService.agents(endpoint.Id);
      }

      $q.all(req)
        .then((data) => {
          const networks = _.forEach(data.networks, (item) => (item.Subs = []));
          if ($scope.applicationState.endpoint.mode.agentProxy && $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
            $scope.networks = groupSwarmNetworksManagerNodesFirst(data.networks, data.agents);
          } else {
            $scope.networks = networks;
          }

          _.forEach($scope.networks, (network) => {
            network.IPAM.IPV4Configs = DockerNetworkHelper.getIPV4Configs(network.IPAM.Config);
            network.IPAM.IPV6Configs = DockerNetworkHelper.getIPV6Configs(network.IPAM.Config);
          });
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
  },
]);
