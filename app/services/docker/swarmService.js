angular.module('portainer.services')
.factory('SwarmService', ['$q', 'Swarm', function SwarmServiceFactory($q, Swarm) {
  'use strict';
  var service = {};

  service.swarm = function() {
    var deferred = $q.defer();

    Swarm.get().$promise
    .then(function success(data) {
      var swarm = new SwarmViewModel(data);
      deferred.resolve(swarm);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Swarm details', err: err });
    });

    return deferred.promise;
  };

  service.extractSwarmInfo = function(info) {
    // Swarm info is available in SystemStatus object
    var systemStatus = info.SystemStatus;
    var swarmInfo = {};
    // Swarm strategy
    swarmInfo[systemStatus[1][0]] = systemStatus[1][1];
    // Swarm filters
    swarmInfo[systemStatus[2][0]] = systemStatus[2][1];
    // Swarm node count
    var nodes = systemStatus[0][1] === 'primary' ? systemStatus[3][1] : systemStatus[4][1];
    var node_count = parseInt(nodes, 10);
    swarmInfo[systemStatus[3][0]] = node_count;
    swarmInfo.Status = extractNodesInfo(systemStatus, node_count);
    return swarmInfo;
  };

  service.extractNodesInfo = function(info, node_count) {
    // First information for node1 available at element #4 of SystemStatus if connected to a primary
    // If connected to a replica, information for node1 is available at element #5
    // The next 10 elements are information related to the node
    var nodes = [];
    var node_offset = info[0][1] === 'primary' ? 4 : 5;
    for (i = 0; i < node_count; i++) {
      nodes.push(extractNodeInfo(info, node_offset));
      node_offset += 9;
    }
    return nodes;
  };

  service.extractNodeInfo = function(info, offset) {
    var node = {};
    node.name = info[offset][0];
    node.ip = info[offset][1];
    node.Id = info[offset + 1][1];
    node.status = info[offset + 2][1];
    node.containers = info[offset + 3][1];
    node.cpu = info[offset + 4][1].split('/')[1];
    node.memory = info[offset + 5][1].split('/')[1];
    node.labels = info[offset + 6][1];
    node.version = info[offset + 8][1];
    return node;
  };

  return service;
}]);
