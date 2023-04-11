import _ from 'lodash-es';

import { confirmDestructive } from '@@/modals/confirm';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { buildConfirmButton } from '@@/modals/utils';

import { commandsTabUtils } from '@/react/docker/containers/CreateView/CommandsTab';
import { volumesTabUtils } from '@/react/docker/containers/CreateView/VolumesTab';
import { networkTabUtils } from '@/react/docker/containers/CreateView/NetworkTab';
import { capabilitiesTabUtils } from '@/react/docker/containers/CreateView/CapabilitiesTab';
import { ContainerDetailsViewModel } from '@/docker/models/container';
import { labelsTabUtils } from '@/react/docker/containers/CreateView/LabelsTab';

import { envVarsTabUtils } from '@/react/docker/containers/CreateView/EnvVarsTab';
import { getContainers } from '@/react/docker/containers/queries/containers';
import { resourcesTabUtils } from '@/react/docker/containers/CreateView/ResourcesTab';
import { restartPolicyTabUtils } from '@/react/docker/containers/CreateView/RestartPolicyTab';
import { baseFormUtils } from '@/react/docker/containers/CreateView/BaseForm';
import { buildImageFullURI } from '@/react/docker/images/utils';

import './createcontainer.css';
import { RegistryTypes } from '@/react/portainer/registries/types/registry';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

angular.module('portainer.docker').controller('CreateContainerController', [
  '$q',
  '$scope',
  '$async',
  '$state',
  '$timeout',
  '$transition$',
  '$analytics',
  'Container',
  'ContainerHelper',
  'ImageHelper',
  'NetworkService',
  'ResourceControlService',
  'Authentication',
  'Notifications',
  'ContainerService',
  'ImageService',
  'FormValidator',
  'RegistryService',
  'SystemService',
  'SettingsService',
  'HttpRequestHelper',
  'endpoint',
  'EndpointService',
  'WebhookService',
  function (
    $q,
    $scope,
    $async,
    $state,
    $timeout,
    $transition$,
    $analytics,
    Container,
    ContainerHelper,
    ImageHelper,
    NetworkService,
    ResourceControlService,
    Authentication,
    Notifications,
    ContainerService,
    ImageService,
    FormValidator,
    RegistryService,
    SystemService,
    SettingsService,
    HttpRequestHelper,
    endpoint,
    EndpointService,
    WebhookService
  ) {
    const nodeName = $transition$.params().nodeName;

    $scope.create = create;
    $scope.endpoint = endpoint;
    $scope.containerWebhookFeature = FeatureId.CONTAINER_WEBHOOK;
    $scope.isAdmin = Authentication.isAdmin();
    const userDetails = this.Authentication.getUserDetails();

    $scope.formValues = {
      commands: commandsTabUtils.getDefaultViewModel(),
      envVars: envVarsTabUtils.getDefaultViewModel(),
      volumes: volumesTabUtils.getDefaultViewModel(),
      network: networkTabUtils.getDefaultViewModel(),
      resources: resourcesTabUtils.getDefaultViewModel(),
      capabilities: capabilitiesTabUtils.getDefaultViewModel(),
      restartPolicy: restartPolicyTabUtils.getDefaultViewModel(),
      labels: labelsTabUtils.getDefaultViewModel(),
      ...baseFormUtils.getDefaultViewModel($scope.isAdmin, userDetails.ID, nodeName),
    };

    $scope.state = {
      formValidationError: '',
      actionInProgress: false,
      mode: '',
      pullImageValidity: true,
      settingUnlimitedResources: false,
      containerIsLoaded: false,
    };

    $scope.handleCommandsChange = handleCommandsChange;
    $scope.handleEnvVarsChange = handleEnvVarsChange;
    $scope.onChange = onChange;

    function onChange(values) {
      $scope.formValues = {
        ...$scope.formValues,
        ...values,
      };
    }

    function handleCommandsChange(commands) {
      return $scope.$evalAsync(() => {
        $scope.formValues.commands = commands;
      });
    }

    function handleEnvVarsChange(value) {
      return $scope.$evalAsync(() => {
        $scope.formValues.envVars = value;
      });
    }
    $scope.isDuplicateValid = function () {
      if (!$scope.fromContainer) {
        return true;
      }

      const duplicatingPortainer = $scope.fromContainer.IsPortainer && $scope.fromContainer.Name === '/' + $scope.config.name;
      const duplicatingWithRegistry = !!$scope.formValues.image.registryId;

      return !duplicatingPortainer && duplicatingWithRegistry;
    };

    $scope.onVolumesChange = function (volumes) {
      return $scope.$evalAsync(() => {
        $scope.formValues.volumes = volumes;
      });
    };
    $scope.onNetworkChange = function (network) {
      return $scope.$evalAsync(() => {
        $scope.formValues.network = network;
      });
    };
    $scope.onLabelsChange = function (labels) {
      return $scope.$evalAsync(() => {
        $scope.formValues.labels = labels;
      });
    };

    $scope.onResourcesChange = function (resources) {
      return $scope.$evalAsync(() => {
        $scope.formValues.resources = resources;
      });
    };

    $scope.onCapabilitiesChange = function (capabilities) {
      return $scope.$evalAsync(() => {
        $scope.formValues.capabilities = capabilities;
      });
    };

    $scope.onRestartPolicyChange = function (restartPolicy) {
      return $scope.$evalAsync(() => {
        $scope.formValues.restartPolicy = restartPolicy;
      });
    };

    $scope.refreshSlider = function () {
      $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
      });
    };

    $scope.onImageNameChange = function () {
      $scope.formValues.CmdMode = 'default';
      $scope.formValues.EntrypointMode = 'default';
    };

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      if (!validity) {
        $scope.formValues.alwaysPull = false;
      }
      $scope.state.pullImageValidity = validity;
    }

    $scope.config = {
      Image: '',
      Env: [],
      Cmd: null,
      MacAddress: '',
      ExposedPorts: {},
      Entrypoint: null,
      WorkingDir: '',
      User: '',
      HostConfig: {
        RestartPolicy: {
          Name: 'no',
        },
        PortBindings: [],
        PublishAllPorts: false,
        Binds: [],
        AutoRemove: false,
        NetworkMode: 'bridge',
        Privileged: false,
        Init: false,
        Runtime: null,
        ExtraHosts: [],
        Devices: [],
        DeviceRequests: [],
        CapAdd: [],
        CapDrop: [],
        Sysctls: {},
        LogConfig: {
          Type: '',
          Config: {},
        },
      },
      NetworkingConfig: {
        EndpointsConfig: {},
      },
      Labels: {},
    };

    async function prepareImageConfig() {
      const registryModel = await getRegistryModel();

      return buildImageFullURI(registryModel);
    }

    async function prepareConfiguration() {
      var config = angular.copy($scope.config);
      config = commandsTabUtils.toRequest(config, $scope.formValues.commands);
      config = envVarsTabUtils.toRequest(config, $scope.formValues.envVars);
      config = volumesTabUtils.toRequest(config, $scope.formValues.volumes);
      config = networkTabUtils.toRequest(config, $scope.formValues.network, $scope.fromContainer.Id);
      config = resourcesTabUtils.toRequest(config, $scope.formValues.resources);
      config = capabilitiesTabUtils.toRequest(config, $scope.formValues.capabilities);
      config = restartPolicyTabUtils.toRequest(config, $scope.formValues.restartPolicy);
      config = labelsTabUtils.toRequest(config, $scope.formValues.labels);
      config = baseFormUtils.toRequest(config, $scope.formValues);

      config.name = $scope.formValues.name;

      config.Image = await prepareImageConfig(config);

      return config;
    }

    async function loadFromContainerWebhook(d) {
      return $async(async () => {
        if (!isBE) {
          return false;
        }

        const data = await WebhookService.webhooks(d.Id, endpoint.Id);
        if (data.webhooks.length > 0) {
          return true;
        }
      });
    }

    function loadFromContainerSpec() {
      // Get container
      Container.get({ id: $transition$.params().from })
        .$promise.then(async function success(d) {
          var fromContainer = new ContainerDetailsViewModel(d);

          $scope.fromContainer = fromContainer;
          $scope.state.mode = 'duplicate';
          $scope.config = ContainerHelper.configFromContainer(angular.copy(d));

          $scope.formValues.commands = commandsTabUtils.toViewModel(d);
          $scope.formValues.envVars = envVarsTabUtils.toViewModel(d);
          $scope.formValues.volumes = volumesTabUtils.toViewModel(d);
          $scope.formValues.network = networkTabUtils.toViewModel(d, $scope.availableNetworks, $scope.runningContainers);
          $scope.formValues.resources = resourcesTabUtils.toViewModel(d);
          $scope.formValues.capabilities = capabilitiesTabUtils.toViewModel(d);
          $scope.formValues.labels = labelsTabUtils.toViewModel(d);
          $scope.formValues.restartPolicy = restartPolicyTabUtils.toViewModel(d);

          const imageModel = await RegistryService.retrievePorRegistryModelFromRepository($scope.config.Image, endpoint.Id);
          const enableWebhook = await loadFromContainerWebhook(d);

          $scope.formValues = baseFormUtils.toViewModel(
            d,
            $scope.isAdmin,
            userDetails.ID,
            {
              image: imageModel.Image,
              useRegistry: imageModel.UseRegistry,
              registryId: imageModel.Registry.Id,
            },
            enableWebhook
          );
        })
        .then(() => {
          $scope.state.containerIsLoaded = true;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container');
        });
    }

    async function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

      $scope.showDeviceMapping = await shouldShowDevices();
      $scope.allowSysctl = await shouldShowSysctls();
      $scope.areContainerCapabilitiesEnabled = await checkIfContainerCapabilitiesEnabled();
      $scope.isAdminOrEndpointAdmin = Authentication.isAdmin();

      var provider = $scope.applicationState.endpoint.mode.provider;
      var apiVersion = $scope.applicationState.endpoint.apiVersion;
      NetworkService.networks(provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE', false, provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25)
        .then(function success(networks) {
          networks.push({ Name: 'container' });
          $scope.availableNetworks = networks.sort((a, b) => a.Name.localeCompare(b.Name));

          $scope.formValues.network = networkTabUtils.getDefaultViewModel(networks.some((network) => network.Name === 'bridge'));
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve networks');
        });
      getContainers(endpoint.Id)
        .then((containers) => {
          $scope.runningContainers = containers;
          $scope.gpuUseAll = _.get($scope, 'endpoint.Snapshots[0].GpuUseAll', false);
          $scope.gpuUseList = _.get($scope, 'endpoint.Snapshots[0].GpuUseList', []);
          if ($transition$.params().from) {
            loadFromContainerSpec();
          } else {
            $scope.state.containerIsLoaded = true;
            $scope.fromContainer = {};
            if ($scope.areContainerCapabilitiesEnabled) {
              $scope.formValues.capabilities = capabilitiesTabUtils.getDefaultViewModel();
            }
          }
        })
        .catch((e) => {
          Notifications.error('Failure', e, 'Unable to retrieve running containers');
        });

      SystemService.info()
        .then(function success(data) {
          $scope.availableRuntimes = data.Runtimes ? Object.keys(data.Runtimes) : [];
          $scope.state.sliderMaxCpu = 32;
          if (data.NCPU) {
            $scope.state.sliderMaxCpu = data.NCPU;
          }
          $scope.state.sliderMaxMemory = 32768;
          if (data.MemTotal) {
            $scope.state.sliderMaxMemory = Math.floor(data.MemTotal / 1000 / 1000);
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve engine details');
        });

      $scope.allowBindMounts = $scope.isAdminOrEndpointAdmin || endpoint.SecuritySettings.allowBindMountsForRegularUsers;
      $scope.allowPrivilegedMode = endpoint.SecuritySettings.allowPrivilegedModeForRegularUsers;
    }

    function create() {
      var oldContainer = null;
      HttpRequestHelper.setPortainerAgentTargetHeader($scope.formValues.nodeName);
      return findCurrentContainer().then(setOldContainer).then(confirmCreateContainer).then(startCreationProcess).catch(notifyOnError).finally(final);

      function final() {
        $scope.state.actionInProgress = false;
      }

      function setOldContainer(container) {
        oldContainer = container;
        return container;
      }

      function findCurrentContainer() {
        return Container.query({ all: 1, filters: { name: ['^/' + $scope.formValues.name + '$'] } })
          .$promise.then(function onQuerySuccess(containers) {
            if (!containers.length) {
              return;
            }
            return containers[0];
          })
          .catch(notifyOnError);

        function notifyOnError(err) {
          Notifications.error('Failure', err, 'Unable to retrieve containers');
        }
      }

      function startCreationProcess(confirmed) {
        if (!confirmed) {
          return $q.when();
        }

        $scope.state.actionInProgress = true;
        return pullImageIfNeeded()
          .then(stopAndRenameContainer)
          .then(createNewContainer)
          .then(applyResourceControl)
          .then(connectToExtraNetworks)
          .then(removeOldContainer)
          .then(onSuccess, onCreationProcessFail);
      }

      function onCreationProcessFail(error) {
        var deferred = $q.defer();
        removeNewContainer()
          .then(restoreOldContainerName)
          .then(function () {
            deferred.reject(error);
          })
          .catch(function (restoreError) {
            deferred.reject(restoreError);
          });
        return deferred.promise;
      }

      function removeNewContainer() {
        return findCurrentContainer().then(function onContainerLoaded(container) {
          if (container && (!oldContainer || container.Id !== oldContainer.Id)) {
            return ContainerService.remove(container, true);
          }
        });
      }

      function restoreOldContainerName() {
        if (!oldContainer) {
          return;
        }
        return ContainerService.renameContainer(oldContainer.Id, oldContainer.Names[0]);
      }

      function confirmCreateContainer(container) {
        if (!container) {
          return $q.when(true);
        }

        return showConfirmationModal();

        function showConfirmationModal() {
          var deferred = $q.defer();

          confirmDestructive({
            title: 'Are you sure?',
            message: 'A container with the same name already exists. Portainer can automatically remove it and re-create one. Do you want to replace it?',
            confirmButton: buildConfirmButton('Replace', 'danger'),
          }).then(function onConfirm(confirmed) {
            deferred.resolve(confirmed);
          });

          return deferred.promise;
        }
      }

      function stopAndRenameContainer() {
        if (!oldContainer) {
          return $q.when();
        }
        return stopContainerIfNeeded(oldContainer).then(renameContainer);
      }

      function stopContainerIfNeeded(oldContainer) {
        if (oldContainer.State !== 'running') {
          return $q.when();
        }
        return ContainerService.stopContainer(oldContainer.Id);
      }

      function renameContainer() {
        return ContainerService.renameContainer(oldContainer.Id, oldContainer.Names[0] + '-old');
      }

      async function pullImageIfNeeded() {
        if (!$scope.formValues.alwaysPull) {
          return;
        }
        const registryModel = await getRegistryModel();
        return ImageService.pullImage(registryModel, true);
      }

      function createNewContainer() {
        return $async(async () => {
          const config = await prepareConfiguration();

          return await ContainerService.createAndStartContainer(config);
        });
      }

      async function sendAnalytics() {
        const publicSettings = await SettingsService.publicSettings();
        const analyticsAllowed = publicSettings.EnableTelemetry;
        const registryModel = await getRegistryModel();
        const image = `${registryModel.Registry.URL}/${registryModel.Image}`;
        if (analyticsAllowed && $scope.formValues.GPU.enabled) {
          $analytics.eventTrack('gpuContainerCreated', {
            category: 'docker',
            metadata: { gpu: $scope.formValues.GPU, containerImage: image },
          });
        }
      }

      function applyResourceControl(newContainer) {
        const userId = Authentication.getUserDetails().ID;
        const resourceControl = newContainer.Portainer.ResourceControl;
        const containerId = newContainer.Id;
        const accessControlData = $scope.formValues.accessControl;

        return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl).then(function onApplyResourceControlSuccess() {
          return containerId;
        });
      }

      function connectToExtraNetworks(newContainerId) {
        if (!$scope.extraNetworks) {
          return $q.when();
        }

        var connectionPromises = _.forOwn($scope.extraNetworks, function (network, networkName) {
          if (_.has(network, 'Aliases')) {
            var aliases = _.filter(network.Aliases, (o) => {
              return !_.startsWith($scope.fromContainer.Id, o);
            });
          }
          return NetworkService.connectContainer(networkName, newContainerId, aliases);
        });

        return $q.all(connectionPromises);
      }

      function removeOldContainer() {
        var deferred = $q.defer();

        if (!oldContainer) {
          deferred.resolve();
          return;
        }

        ContainerService.remove(oldContainer, true).then(notifyOnRemoval).catch(notifyOnRemoveError);

        return deferred.promise;

        function notifyOnRemoval() {
          Notifications.success('Container Removed', oldContainer.Id);
          deferred.resolve();
        }

        function notifyOnRemoveError(err) {
          deferred.reject({ msg: 'Unable to remove container', err: err });
        }
      }

      function notifyOnError(err) {
        Notifications.error('Failure', err, 'Unable to create container');
      }

      async function onSuccess() {
        await sendAnalytics();
        Notifications.success('Success', 'Container successfully created');
        $state.go('docker.containers', {}, { reload: true });
      }
    }

    async function shouldShowDevices() {
      return endpoint.SecuritySettings.allowDeviceMappingForRegularUsers || Authentication.isAdmin();
    }

    async function shouldShowSysctls() {
      return endpoint.SecuritySettings.allowSysctlSettingForRegularUsers || Authentication.isAdmin();
    }

    async function checkIfContainerCapabilitiesEnabled() {
      return endpoint.SecuritySettings.allowContainerCapabilitiesForRegularUsers || Authentication.isAdmin();
    }

    async function getRegistryModel() {
      const image = $scope.formValues.image;
      const registries = await EndpointService.registries(endpoint.Id);
      return {
        Image: image.image,
        UseRegistry: image.useRegistry,
        Registry: registries.find((registry) => registry.Id === image.registryId) || {
          Id: 0,
          Name: 'Docker Hub',
          Type: RegistryTypes.ANONYMOUS,
        },
      };
    }

    initView();
  },
]);
