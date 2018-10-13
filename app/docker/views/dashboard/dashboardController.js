angular.module('portainer.docker')
.controller('DashboardController', ['$scope', '$q', 'ContainerService', 'ImageService', 'NetworkService', 'VolumeService', 'SystemService', 'ServiceService', 'StackService', 'EndpointService', 'Notifications', 'EndpointProvider', 'StateManager',
function ($scope, $q, ContainerService, ImageService, NetworkService, VolumeService, SystemService, ServiceService, StackService, EndpointService, Notifications, EndpointProvider, StateManager) {

  $scope.dismissInformationPanel = function(id) {
    StateManager.dismissInformationPanel(id);
  };

  $scope.endpointStatus = 1;

  function initView() {
    var endpointMode = $scope.applicationState.endpoint.mode;
    var endpointId = EndpointProvider.endpointID();

    $q.all({
      containers: ContainerService.containers(1),
      images: ImageService.images(false),
      volumes: VolumeService.volumes(),
      networks: NetworkService.networks(true, true, true),
      services: endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER' ? ServiceService.services() : [],
      stacks: StackService.stacks(true, endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER', endpointId),
      info: SystemService.info(),
      endpoint: EndpointService.endpoint(endpointId)
    })
    .then(function success(data) {
      $scope.containers = data.containers;
      $scope.images = data.images;
      $scope.volumeCount = data.volumes.length;
      $scope.networkCount = data.networks.length;
      $scope.serviceCount = data.services.length;
      $scope.stackCount = data.stacks.length;
      $scope.info = data.info;
      $scope.endpoint = data.endpoint;
      $scope.endpointStatus = EndpointProvider.endpointStatus();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load dashboard data');
    });
  }

  initView();
}]);
