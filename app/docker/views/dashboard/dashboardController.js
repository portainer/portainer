import angular from 'angular';
import _ from 'lodash';

import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';
import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';
import { useContainerStatusComponent } from '@/react/docker/DashboardView/ContainerStatus';
import { useImagesTotalSizeComponent } from '@/react/docker/DashboardView/ImagesTotalSize';

angular.module('portainer.docker').controller('DashboardController', [
  '$scope',
  '$q',
  'Authentication',
  'ContainerService',
  'ImageService',
  'NetworkService',
  'VolumeService',
  'SystemService',
  'ServiceService',
  'StackService',
  'Notifications',
  'StateManager',
  'TagService',
  'endpoint',
  function (
    $scope,
    $q,
    Authentication,
    ContainerService,
    ImageService,
    NetworkService,
    VolumeService,
    SystemService,
    ServiceService,
    StackService,
    Notifications,
    StateManager,
    TagService,
    endpoint
  ) {
    $scope.dismissInformationPanel = function (id) {
      StateManager.dismissInformationPanel(id);
    };

    $scope.offlineMode = false;
    $scope.showStacks = false;

    async function initView() {
      const endpointMode = $scope.applicationState.endpoint.mode;
      $scope.endpoint = endpoint;

      $scope.showStacks = await shouldShowStacks();
      $scope.showEnvUrl = endpoint.Type !== PortainerEndpointTypes.EdgeAgentOnDockerEnvironment && endpoint.Type !== PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment;
      $q.all({
        containers: ContainerService.containers(1),
        images: ImageService.images(false),
        volumes: VolumeService.volumes(),
        networks: NetworkService.networks(true, true, true),
        services: endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER' ? ServiceService.services() : [],
        stacks: StackService.stacks(true, endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER', endpoint.Id),
        info: SystemService.info(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          $scope.containers = data.containers;
          $scope.containerStatusComponent = useContainerStatusComponent(data.containers);

          $scope.images = data.images;
          $scope.imagesTotalSizeComponent = useImagesTotalSizeComponent(imagesTotalSize(data.images));

          $scope.volumeCount = data.volumes.length;
          $scope.networkCount = data.networks.length;
          $scope.serviceCount = data.services.length;
          $scope.stackCount = data.stacks.length;
          $scope.info = data.info;
          $scope.endpointTags = endpoint.TagIds.length
            ? _.join(
                _.filter(
                  _.map(endpoint.TagIds, (id) => {
                    const tag = data.tags.find((tag) => tag.Id === id);
                    return tag ? tag.Name : '';
                  }),
                  Boolean
                ),
                ', '
              )
            : '-';
          $scope.offlineMode = isOfflineEndpoint(endpoint);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load dashboard data');
        });
    }

    async function shouldShowStacks() {
      const isAdmin = Authentication.isAdmin();

      return isAdmin || endpoint.SecuritySettings.allowStackManagementForRegularUsers;
    }

    initView();
  },
]);

function imagesTotalSize(images) {
  return images.reduce((acc, image) => acc + image.VirtualSize, 0);
}
