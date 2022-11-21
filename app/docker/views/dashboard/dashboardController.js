import angular from 'angular';
import _ from 'lodash';

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

    $scope.showStacks = false;

    $scope.buildGpusStr = function (gpuUseSet) {
      var gpusAvailable = new Object();
      for (let i = 0; i < ($scope.endpoint.Gpus || []).length; i++) {
        if (!gpuUseSet.has($scope.endpoint.Gpus[i].name)) {
          var exist = false;
          for (let gpuAvailable in gpusAvailable) {
            if ($scope.endpoint.Gpus[i].value == gpuAvailable) {
              gpusAvailable[gpuAvailable] += 1;
              exist = true;
            }
          }
          if (exist === false) {
            gpusAvailable[$scope.endpoint.Gpus[i].value] = 1;
          }
        }
      }
      var retStr = Object.keys(gpusAvailable).length
        ? _.join(
            _.map(Object.keys(gpusAvailable), (gpuAvailable) => {
              var _str = gpusAvailable[gpuAvailable];
              _str += ' x ';
              _str += gpuAvailable;
              return _str;
            }),
            ' + '
          )
        : 'none';
      return retStr;
    };

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

          $scope.gpuInfoStr = $scope.buildGpusStr(new Set());
          $scope.gpuUseAll = _.get($scope, 'endpoint.Snapshots[0].GpuUseAll', false);
          $scope.gpuUseList = _.get($scope, 'endpoint.Snapshots[0].GpuUseList', []);
          $scope.gpuFreeStr = 'all';
          if ($scope.gpuUseAll == true) $scope.gpuFreeStr = 'none';
          else $scope.gpuFreeStr = $scope.buildGpusStr(new Set($scope.gpuUseList));

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
