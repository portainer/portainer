angular.module('portainer.services')
.factory('InfraService', ['$q', 'Notifications', 'EndpointService', 'InfoHelper', 'SystemService', 'NodeService', function InfraServiceFactory($q, Notifications, EndpointService, InfoHelper, SystemService, NodeService) {
  'use strict';
  var service = {};

  var epStates = [];
  var swarms = [];
  var nonswarms = [];
  var loadingState = false;

  var stats = {
    ActiveSwarms: 0,
    ManagerCount: 0,
    ActiveManagerCount: 0,
    WorkerCount: 0,
    ActiveWorkerCount: 0,
    OSWindowsCount: 0,
    OSLinuxCount: 0,
    OSOtherCount: 0
  };

  function getEndpointState(endpointId) {
    var deferred = $q.defer();
    $q.all({
      info: SystemService.infraInfo(endpointId)
    })
    .then(function success(data) {
      var endpointMode = InfoHelper.determineEndpointMode(data.info);

      var infoData = {};
      var nodes = [];
      var clusterId = "";
      if (endpointMode.role == "MANAGER") {
        infoData = data.info;

        //var dataInfoStr = JSON.stringify(infoData, null, 2);
        //console.log("MANAGER DATA: " + dataInfoStr);

        if (infoData.Swarm && infoData.Swarm.Cluster && infoData.Swarm.Cluster.ID) {
            clusterId = infoData.Swarm.Cluster.ID;
        } else {
            // Default
            clusterId = infoData.ID;
        }

        NodeService.nodesByEndpointId(endpointId)
        .then(function success(data) {
            nodes = [];
            var foundLeader = false;

            for (var i = 0; i < data.length; i++) {
                var nodeEntry = data[i];
                var node = {};

                //var dataStr = JSON.stringify(nodeEntry);
                //console.log("ENTRY: " + dataStr);

                node.Hostname = nodeEntry.Model.Description.Hostname;
                if (nodeEntry.Model.Description.Platform.OS) {
                    node.OS = nodeEntry.Model.Description.Platform.OS;
                } else {
                    node.OS = "unknown";
                }

                node.Availability = nodeEntry.Model.Spec.Availability;
                node.Role = nodeEntry.Model.Spec.Role;

                if (nodeEntry.Model.ManagerStatus && nodeEntry.Model.ManagerStatus.Leader && nodeEntry.Model.ManagerStatus.Leader == true) {
                    if (infoData.Name == node.Hostname) {
                        foundLeader = true;
                    }
                }
                nodes.push(node);
            }

            epStates.push({
                id:   endpointId,
                role: endpointMode.role,
                provider: endpointMode.provider,
                data: infoData,
                swarmId: (foundLeader == true) ? clusterId : "",
                leader: foundLeader,
                nodes: (foundLeader == true) ? nodes : []
            });

            deferred.resolve();
        });
      } else {
        epStates.push({
            id:   endpointId,
            role: endpointMode.role,
            provider: endpointMode.provider,
            data: infoData,
            swarmId: "",
            leader: false,
            nodes: nodes
        });

        deferred.resolve();
      }

    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to connect to the Docker endpoint', err: err});
    });

    return deferred.promise;
  };

  service.getEndpointStates = function(endpoints) {
    epStates = [];
    var epPromises = [];

    for (var i = 0; i < endpoints.length; i++) {
        var endpoint = endpoints[i];
        epPromises.push(getEndpointState(endpoint.Id));
    }

    return $q.all(epPromises)
    .then(function success(data) {
        return epStates;
    })
    .catch(function error(err) {
        //console.log("Error: " + JSON.stringify(err));
    })
    .finally(function final() {
        return epStates;
    });
  };

  service.resetSwarms = function() {
    swarms = [];
  };

  service.getSwarms = function() {
    return swarms;
  };

  service.setSwarms = function(swarmList) {
    swarms = swarmList;
  };

  service.resetNonSwarms = function() {
    nonswarms = [];
  };

  service.getNonSwarms = function() {
    return nonswarms;
  };

  service.setNonSwarms = function(nonSwarmList) {
    nonswarms = nonSwarmList;
  };

  service.getDataLoading = function() {
    return loadingState;
  };

  service.setDataLoading = function(value) {
    loadingState = value;
  };

  service.determineSwarmStats = function() {
    stats = {
        ActiveSwarms: 0,
        ManagerCount: 0,
        ActiveManagerCount: 0,
        WorkerCount: 0,
        ActiveWorkerCount: 0,
        OSWindowsCount: 0,
        OSLinuxCount: 0,
        OSOtherCount: 0,
        NonSwarmEndpoints: nonswarms.length,
    };
    for (var j = 0; j < swarms.length; j++) {
        var swarmEntry = swarms[j];

        if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.leader == true) {
            stats.ActiveSwarms += 1;
        }

        if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.role == "MANAGER") {
            stats.ManagerCount += 1;
        } else if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.role == "WORKER") {
            stats.WorkerCount += 1;
        }

        // Only get stats from leaders
        if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.leader == true) {
            for (var k = 0; k < swarmEntry.nodes.length; k++) {
                var node = swarmEntry.nodes[k];

                if (node) {
                    if (node.OS == "linux") {
                        stats.OSLinuxCount += 1;
                    } else if (node.OS == "windows") {
                        stats.OSWindowsCount += 1;
                    } else {
                        stats.OSOtherCount += 1;
                    }

                    if (node.Availability == "active") {
                        if (node.Role == "manager") {
                            stats.ActiveManagerCount += 1;
                        } else {
                            stats.ActiveWorkerCount += 1;
                        }
                    }
                }
            }
        }
    }

    return stats;
  };

  return service;
}]);
