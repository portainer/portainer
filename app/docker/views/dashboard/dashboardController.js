angular.module('portainer.docker')
.controller('DashboardController', ['$scope', '$q', 'Container', 'ContainerHelper', 'Image', 'Network', 'Volume', 'SystemService', 'ServiceService', 'StackService', 'Notifications', 'EndpointProvider',
function ($scope, $q, Container, ContainerHelper, Image, Network, Volume, SystemService, ServiceService, StackService, Notifications, EndpointProvider) {

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

  function initView() {
    var endpointMode = $scope.applicationState.endpoint.mode;
    var endpointId = EndpointProvider.endpointID();

    $q.all([
      Container.query({all: 1}).$promise,
      Image.query({}).$promise,
      Volume.query({}).$promise,
      Network.query({}).$promise,
      SystemService.info(),
      endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER' ? ServiceService.services() : [],
      StackService.stacks(
        true,
        endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER',
        endpointId
      )
    ]).then(function (d) {
      prepareContainerData(d[0]);
      prepareImageData(d[1]);
      prepareVolumeData(d[2]);
      prepareNetworkData(d[3]);
      prepareInfoData(d[4]);
      $scope.serviceCount = d[5].length;
      $scope.stackCount = d[6].length;
    }, function(e) {
      Notifications.error('Failure', e, 'Unable to load dashboard data');
    });
  }

  initView();
}]);
