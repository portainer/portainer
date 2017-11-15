angular.module('infradashboard', [])
.controller('InfraDashboardController', ['$scope', '$q', 'InfraService', 'SwarmService', 'InfoHelper', 'SystemService', 'NodeService', 'EndpointProvider', 'EndpointService', 'Container', 'ContainerHelper', 'Image', 'Network', 'Volume', 'SystemService', 'ServiceService', 'StackService', 'Notifications',
function ($scope, $q, InfraService, SwarmService, InfoHelper, SystemService, NodeService, EndpointProvider, EndpointService, Container, ContainerHelper, Image, Network, Volume, SystemService, ServiceService, StackService, Notifications) {

  function initView() {
    $scope.spinner = true;

    $scope.applicationState.infra = true;

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

    // TODO: add re-discover or refresh option later
    var tmpSwarms = InfraService.getSwarms();
    var tmpNonSwarms = InfraService.getNonSwarms();
    if (tmpSwarms.length == 0) {
        EndpointService.endpoints()
        .then(function success(data) {
          $scope.endpoints = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve endpoints');
          $scope.endpoints = [];
        })
        .finally(function final() {
          InfraService.getEndpointStates($scope.endpoints)
          .then(function success(data) {
            var foundSwarms = [];
            var foundNonSwarms = [];
            for (var i = 0; i < data.length; i++) {
                var epEntry = data[i];

                // TODO: improve this mapping, likely on initial EP setup...
                for (var j = 0; j < $scope.endpoints.length; j++) {
                    var oldEpEntry = $scope.endpoints[j];
                    if (oldEpEntry.Id == epEntry.id) {
                        epEntry.name = oldEpEntry.Name;
                        break;
                    }
                }

                if (epEntry.provider == "DOCKER_SWARM_MODE") {
                    foundSwarms.push(epEntry)
                } else {
                    foundNonSwarms.push(epEntry);
                }
            }
            $scope.swarms = foundSwarms;
            $scope.nonswarms = foundNonSwarms;
            InfraService.setSwarms(foundSwarms);
            InfraService.setNonSwarms(foundNonSwarms);
            $scope.stats = InfraService.determineSwarmStats($scope.swarms);
          })
          .finally(function final() {
            $scope.spinner = false;
          });
        });
    } else {
        // Just re-calc stats
        $scope.swarms = tmpSwarms;
        $scope.noneswarms = tmpNonSwarms;
        $scope.stats = InfraService.determineSwarmStats($scope.swarms);
        $scope.spinner = false;
    }

  }

  initView();
}]);
