angular.module('swarm', [])
.controller('SwarmController', ['$scope', 'Info', 'Version', 'Node',
function ($scope, Info, Version, Node) {

  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.info = {};
  $scope.docker = {};
  $scope.swarm = {};
  $scope.swarm_mode = false;
  $scope.totalCPU = 0;
  $scope.totalMemory = 0;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  Version.get({}, function (d) {
    $scope.docker = d;
  });

  Info.get({}, function (d) {
    $scope.info = d;
    if (!_.startsWith(d.ServerVersion, 'swarm')) {
      $scope.swarm_mode = true;
      Node.query({}, function(d) {
        $scope.nodes = d;
        var CPU = 0, memory = 0;
        angular.forEach(d, function(node) {
          CPU += node.Description.Resources.NanoCPUs;
          memory += node.Description.Resources.MemoryBytes;
        });
        $scope.totalCPU = CPU / 1000000000;
        $scope.totalMemory = memory;
      });
    } else {
      extractSwarmInfo(d);
    }
  });

  function extractSwarmInfo(info) {
    // Swarm info is available in SystemStatus object
    var systemStatus = info.SystemStatus;
    // Swarm strategy
    $scope.swarm[systemStatus[1][0]] = systemStatus[1][1];
    // Swarm filters
    $scope.swarm[systemStatus[2][0]] = systemStatus[2][1];
    // Swarm node count
    var node_count = parseInt(systemStatus[3][1], 10);
    $scope.swarm[systemStatus[3][0]] = node_count;

    $scope.swarm.Status = [];
    extractNodesInfo(systemStatus, node_count);
  }

  function extractNodesInfo(info, node_count) {
    // First information for node1 available at element #4 of SystemStatus
    // The next 10 elements are information related to the node
    var node_offset = 4;
    for (i = 0; i < node_count; i++) {
      extractNodeInfo(info, node_offset);
      node_offset += 9;
    }
  }

  function extractNodeInfo(info, offset) {
    var node = {};
    node.name = info[offset][0];
    node.ip = info[offset][1];
    node.id = info[offset + 1][1];
    node.status = info[offset + 2][1];
    node.containers = info[offset + 3][1];
    node.cpu = info[offset + 4][1].split('/')[1];
    node.memory = info[offset + 5][1].split('/')[1];
    node.labels = info[offset + 6][1];
    node.version = info[offset + 8][1];
    $scope.swarm.Status.push(node);
  }
}]);
