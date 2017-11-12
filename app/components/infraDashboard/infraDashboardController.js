angular.module('infradashboard', [])
.controller('InfraDashboardController', ['$scope', '$q', 'SwarmService', 'InfoHelper', 'SystemService', 'NodeService', 'EndpointProvider', 'EndpointService', 'Container', 'ContainerHelper', 'Image', 'Network', 'Volume', 'SystemService', 'ServiceService', 'StackService', 'Notifications',
function ($scope, $q, SwarmService, InfoHelper, SystemService, NodeService, EndpointProvider, EndpointService, Container, ContainerHelper, Image, Network, Volume, SystemService, ServiceService, StackService, Notifications) {

  $scope.swarms = [];

  $scope.containerData = {
    total: 0
  };
  $scope.imageData = {
    total: 0
  };
  $scope.networkData = {
    total: 0
  };
  $scope.volumeData = {
    total: 0
  };

  $scope.serviceCount = 0;
  $scope.stackCount = 0;

  function prepareContainerData(d) {
    var running = 0;
    var stopped = 0;
    var containers = d;

    for (var i = 0; i < containers.length; i++) {
      var item = containers[i];
      if (item.Status.indexOf('Up') !== -1) {
        running += 1;
      } else if (item.Status.indexOf('Exit') !== -1) {
        stopped += 1;
      }
    }
    $scope.containerData.running = running;
    $scope.containerData.stopped = stopped;
    $scope.containerData.total = containers.length;
  }

  function prepareImageData(d) {
    var images = d;
    var totalImageSize = 0;
    for (var i = 0; i < images.length; i++) {
      var item = images[i];
      totalImageSize += item.VirtualSize;
    }
    $scope.imageData.total = images.length;
    $scope.imageData.size = totalImageSize;
  }

  function prepareVolumeData(d) {
    var volumes = d.Volumes;
    if (volumes) {
      $scope.volumeData.total = volumes.length;
    }
  }

  function prepareNetworkData(d) {
    var networks = d;
    $scope.networkData.total = networks.length;
  }

  function prepareInfoData(d) {
    var info = d;
    $scope.infoData = info;
  }

  function getEndpointState(endpointId) {
    var deferred = $q.defer();
    $q.all({
      info: SystemService.infraInfo(endpointId)
    })
    .then(function success(data) {
      var endpointMode = InfoHelper.determineEndpointMode(data.info);

      var infoData = {};
      var nodes = [];
      if (endpointMode.role == "MANAGER") {
        infoData = data.info;
        foundLeader = false;

        //var dataInfoStr = JSON.stringify(infoData);
        //console.log("MANAGER DATA: " + dataInfoStr);

        NodeService.nodesByEndpointId(endpointId)
        .then(function success(data) {
            nodes = [];
            for (var i = 0; i < data.length; i++) {
                var nodeEntry = data[i];
                var node = {};

                //var dataStr = JSON.stringify(nodeEntry);
                //console.log("ENTRY: " + dataStr);

                //ENTRY: {"Model":{"ID":"qt3057ncoazxfpxa4hr3j757c","Description":{"Hostname":"tools01.qa-devops-01.cenx.localnet","ManagerStatus":{"Leader":true

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

            $scope.swarms.push({
                id:   endpointId,
                role: endpointMode.role,
                provider: endpointMode.provider,
                data: infoData,
                leader: foundLeader,
                nodes: (foundLeader == true) ? nodes : []
            });

            deferred.resolve();
        });
      } else {
        $scope.swarms.push({
            id:   endpointId,
            role: endpointMode.role,
            provider: endpointMode.provider,
            data: infoData,
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

  function getEndpointStates() {
    epPromises = [];
    for (var i = 0; i < $scope.endpoints.length; i++) {
        var endpoint = $scope.endpoints[i];
        epPromises.push(getEndpointState(endpoint.Id));
    }
    return $q.all(epPromises);
  };

  function determineSwarmStats() {
    $scope.stats = {
        ActiveSwarms: 0,
        ManagerCount: 0,
        ActiveManagerCount: 0,
        WorkerCount: 0,
        ActiveWorkerCount: 0,
        OSWindowsCount: 0,
        OSLinuxCount: 0,
        OSOtherCount: 0
    };
    for (var j = 0; j < $scope.swarms.length; j++) {
        var swarmEntry = $scope.swarms[j];

        if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.leader == true) {
            $scope.stats.ActiveSwarms += 1;
        }

        if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.role == "MANAGER") {
            $scope.stats.ManagerCount += 1;
        } else if (swarmEntry.provider == "DOCKER_SWARM_MODE" && swarmEntry.role == "WORKER") {
            $scope.stats.WorkerCount += 1;
        }

        for (var k = 0; k < swarmEntry.nodes.length; k++) {
            var node = swarmEntry.nodes[k];

            if (node) {
                if (node.OS == "linux") {
                    $scope.stats.OSLinuxCount += 1;
                } else if (node.OS == "windows") {
                    $scope.stats.OSWindowsCount += 1;
                } else {
                    $scope.stats.OSOtherCount += 1;
                }

                if (node.Availability == "active") {
                    if (node.Role == "manager") {
                        $scope.stats.ActiveManagerCount += 1;
                    } else {
                        $scope.stats.ActiveWorkerCount += 1;
                    }
                }
            }
        }
    }
  };

  function initView() {
    $('#loadingViewSpinner').show();

    $scope.applicationState.infra = true;
    $scope.swarms = [];

    EndpointService.endpoints()
    .then(function success(data) {
      $scope.endpoints = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
      $scope.endpoints = [];
    })
    .finally(function final() {
      getEndpointStates()
      .then(function success(data) {
        determineSwarmStats();
      })
      .finally(function final() {
        //console.log("Complete swarm stats check");
      });
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
