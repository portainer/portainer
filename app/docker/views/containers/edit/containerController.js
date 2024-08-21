import moment from 'moment';
import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { confirmContainerDeletion } from '@/react/docker/containers/common/confirm-container-delete-modal';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { confirmContainerRecreation } from '@/react/docker/containers/ItemView/ConfirmRecreationModal';
import { commitContainer } from '@/react/docker/proxy/queries/useCommitContainerMutation';
import { semverCompare } from '@/react/common/semver-utils';

angular.module('portainer.docker').controller('ContainerController', [
  '$q',
  '$scope',
  '$state',
  '$transition$',
  '$filter',
  '$async',
  'ContainerService',
  'ImageHelper',
  'Notifications',
  'HttpRequestHelper',
  'Authentication',
  'endpoint',
  function ($q, $scope, $state, $transition$, $filter, $async, ContainerService, ImageHelper, Notifications, HttpRequestHelper, Authentication, endpoint) {
    $scope.resourceType = ResourceControlType.Container;
    $scope.endpoint = endpoint;
    $scope.isAdmin = Authentication.isAdmin();
    $scope.activityTime = 0;
    $scope.portBindings = [];
    $scope.displayRecreateButton = false;
    $scope.displayCreateWebhookButton = false;
    $scope.containerWebhookFeature = FeatureId.CONTAINER_WEBHOOK;

    $scope.config = {
      RegistryModel: new PorImageRegistryModel(),
      commitInProgress: false,
    };

    $scope.state = {
      recreateContainerInProgress: false,
      pullImageValidity: false,
    };

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      $scope.state.pullImageValidity = validity;
    }

    $scope.updateRestartPolicy = updateRestartPolicy;

    $scope.onUpdateResourceControlSuccess = function () {
      $state.reload();
    };

    $scope.computeDockerGPUCommand = () => {
      const gpuOptions = _.find($scope.container.HostConfig.DeviceRequests, function (o) {
        return o.Driver === 'nvidia' || o.Capabilities[0][0] === 'gpu';
      });
      if (!gpuOptions) {
        return 'No GPU config found';
      }
      let gpuStr = 'all';
      if (gpuOptions.Count !== -1) {
        gpuStr = `"device=${_.join(gpuOptions.DeviceIDs, ',')}"`;
      }
      // we only support a single set of capabilities for now
      // creation UI needs to be reworked in order to support OR combinations of AND capabilities
      const capStr = `"capabilities=${_.join(gpuOptions.Capabilities[0], ',')}"`;
      return `${gpuStr},${capStr}`;
    };

    var update = function () {
      var nodeName = $transition$.params().nodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      $scope.nodeName = nodeName;

      ContainerService.container(endpoint.Id, $transition$.params().id)
        .then(function success(data) {
          var container = data;
          $scope.container = container;
          $scope.container.edit = false;
          $scope.container.newContainerName = $filter('trimcontainername')(container.Name);

          if (container.State.Running) {
            $scope.activityTime = moment.duration(moment(container.State.StartedAt).utc().diff(moment().utc())).humanize();
          } else if (container.State.Status === 'created') {
            $scope.activityTime = moment.duration(moment(container.Created).utc().diff(moment().utc())).humanize();
          } else {
            $scope.activityTime = moment.duration(moment().utc().diff(moment(container.State.FinishedAt).utc())).humanize();
          }

          $scope.portBindings = [];
          if (container.NetworkSettings.Ports) {
            _.forEach(Object.keys(container.NetworkSettings.Ports), function (key) {
              if (container.NetworkSettings.Ports[key]) {
                _.forEach(container.NetworkSettings.Ports[key], (portMapping) => {
                  const mapping = {};
                  mapping.container = key;
                  mapping.host = `${portMapping.HostIp}:${portMapping.HostPort}`;
                  $scope.portBindings.push(mapping);
                });
              }
            });
          }

          $scope.container.Config.Env = _.sortBy($scope.container.Config.Env, _.toLower);
          const inSwarm = $scope.container.Config.Labels['com.docker.swarm.service.id'];
          const autoRemove = $scope.container.HostConfig.AutoRemove;
          const admin = Authentication.isAdmin();
          const {
            allowContainerCapabilitiesForRegularUsers,
            allowHostNamespaceForRegularUsers,
            allowDeviceMappingForRegularUsers,
            allowSysctlSettingForRegularUsers,
            allowBindMountsForRegularUsers,
            allowPrivilegedModeForRegularUsers,
          } = endpoint.SecuritySettings;

          const settingRestrictsRegularUsers =
            !allowContainerCapabilitiesForRegularUsers ||
            !allowBindMountsForRegularUsers ||
            !allowDeviceMappingForRegularUsers ||
            !allowSysctlSettingForRegularUsers ||
            !allowHostNamespaceForRegularUsers ||
            !allowPrivilegedModeForRegularUsers;

          const apiVersion = endpoint.Snapshots[0] ? endpoint.Snapshots[0].DockerSnapshotRaw.Version.ApiVersion : '1.24';
          const isApiVersion1_44OrGreater = semverCompare(apiVersion, '1.44') >= 0;
          // isCreateContainerSupported is true if the API version is 1.44 or greater, or if the container does not have a MacAddress
          // see https://github.com/moby/moby/blob/f9522e5e96c3ab5a6b8a643d15a92700ca864da6/client/container_create.go#L44
          // podman 5.1.1 currently shows an api version of 1.41 and has container networks with mac addresses, so hide the recreate button in this case
          const isCreateContainerSupported = isApiVersion1_44OrGreater || !container.NetworkSettings.MacAddress;
          $scope.displayDuplicateEditButton = !inSwarm && !autoRemove && (admin || !settingRestrictsRegularUsers);
          $scope.displayRecreateButton = $scope.displayDuplicateEditButton && isCreateContainerSupported;
          $scope.displayCreateWebhookButton = $scope.displayRecreateButton;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container info');
        });
    };

    function executeContainerAction(id, action, successMessage, errorMessage) {
      action(endpoint.Id, id)
        .then(function success() {
          Notifications.success(successMessage, id);
          update();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, errorMessage);
        });
    }

    $scope.start = function () {
      var successMessage = 'Container successfully started';
      var errorMessage = 'Unable to start container';
      executeContainerAction($transition$.params().id, ContainerService.startContainer, successMessage, errorMessage);
    };

    $scope.stop = function () {
      var successMessage = 'Container successfully stopped';
      var errorMessage = 'Unable to stop container';
      executeContainerAction($transition$.params().id, ContainerService.stopContainer, successMessage, errorMessage);
    };

    $scope.kill = function () {
      var successMessage = 'Container successfully killed';
      var errorMessage = 'Unable to kill container';
      executeContainerAction($transition$.params().id, ContainerService.killContainer, successMessage, errorMessage);
    };

    $scope.pause = function () {
      var successMessage = 'Container successfully paused';
      var errorMessage = 'Unable to pause container';
      executeContainerAction($transition$.params().id, ContainerService.pauseContainer, successMessage, errorMessage);
    };

    $scope.unpause = function () {
      var successMessage = 'Container successfully resumed';
      var errorMessage = 'Unable to resume container';
      executeContainerAction($transition$.params().id, ContainerService.resumeContainer, successMessage, errorMessage);
    };

    $scope.restart = function () {
      var successMessage = 'Container successfully restarted';
      var errorMessage = 'Unable to restart container';
      executeContainerAction($transition$.params().id, ContainerService.restartContainer, successMessage, errorMessage);
    };

    $scope.renameContainer = function () {
      var container = $scope.container;
      if (container.newContainerName === $filter('trimcontainername')(container.Name)) {
        $scope.container.edit = false;
        return;
      }
      ContainerService.renameContainer(endpoint.Id, $transition$.params().id, container.newContainerName)
        .then(function success() {
          container.Name = container.newContainerName;
          Notifications.success('Container successfully renamed', container.Name);
        })
        .catch(function error(err) {
          container.newContainerName = $filter('trimcontainername')(container.Name);
          Notifications.error('Failure', err, 'Unable to rename container');
        })
        .finally(function final() {
          $scope.container.edit = false;
          $scope.$apply();
        });
    };

    async function commitContainerAsync() {
      $scope.config.commitInProgress = true;
      const registryModel = $scope.config.RegistryModel;
      const imageConfig = ImageHelper.createImageConfigForContainer(registryModel);
      try {
        await commitContainer(endpoint.Id, { container: $transition$.params().id, repo: imageConfig.fromImage });
        Notifications.success('Image created', $transition$.params().id);
        $state.reload();
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to create image');
        $scope.config.commitInProgress = false;
      }
    }

    $scope.commit = function () {
      return $async(commitContainerAsync);
    };

    $scope.confirmRemove = function () {
      return $async(async () => {
        var title = 'You are about to remove a container.';
        if ($scope.container.State.Running) {
          title = 'You are about to remove a running container.';
        }

        const result = await confirmContainerDeletion(title);

        if (!result) {
          return;
        }
        const { removeVolumes } = result;

        removeContainer(removeVolumes);
      });
    };

    function removeContainer(cleanAssociatedVolumes) {
      ContainerService.remove(endpoint.Id, $scope.container.Id, cleanAssociatedVolumes)
        .then(function success() {
          Notifications.success('Success', 'Container successfully removed');
          $state.go('docker.containers', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove container');
        });
    }

    function recreateContainer(pullImage) {
      var container = $scope.container;
      $scope.state.recreateContainerInProgress = true;

      return ContainerService.recreateContainer(endpoint.Id, container.Id, pullImage).then(notifyAndChangeView).catch(notifyOnError);

      function notifyAndChangeView() {
        Notifications.success('Success', 'Container successfully re-created');
        $state.go('docker.containers', {}, { reload: true });
      }

      function notifyOnError(err) {
        Notifications.error('Failure', err, 'Unable to re-create container');
        $scope.state.recreateContainerInProgress = false;
      }
    }

    $scope.recreate = function () {
      const cannotPullImage = !$scope.container.Config.Image || $scope.container.Config.Image.toLowerCase().startsWith('sha256');
      confirmContainerRecreation(cannotPullImage).then(function (result) {
        if (!result) {
          return;
        }

        recreateContainer(result.pullLatest);
      });
    };

    function updateRestartPolicy(restartPolicy, maximumRetryCount) {
      maximumRetryCount = restartPolicy === 'on-failure' ? maximumRetryCount : undefined;

      return ContainerService.updateRestartPolicy(endpoint.Id, $scope.container.Id, restartPolicy, maximumRetryCount).then(onUpdateSuccess).catch(notifyOnError);

      function onUpdateSuccess() {
        $scope.container.HostConfig.RestartPolicy = {
          Name: restartPolicy,
          MaximumRetryCount: maximumRetryCount,
        };
        Notifications.success('Success', 'Restart policy updated');
      }

      function notifyOnError(err) {
        Notifications.error('Failure', err, 'Unable to update restart policy');
        return $q.reject(err);
      }
    }

    update();
  },
]);
