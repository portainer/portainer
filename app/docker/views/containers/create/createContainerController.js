import _ from 'lodash-es';

import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

import { confirmDestructive } from '@@/modals/confirm';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { buildConfirmButton } from '@@/modals/utils';

import { commandsTabUtils } from '@/react/docker/containers/CreateView/CommandsTab';
import { volumesTabUtils } from '@/react/docker/containers/CreateView/VolumesTab';
import { networkTabUtils } from '@/react/docker/containers/CreateView/NetworkTab';
import { capabilitiesTabUtils } from '@/react/docker/containers/CreateView/CapabilitiesTab';
import { AccessControlFormData } from '@/portainer/components/accessControlForm/porAccessControlFormModel';
import { ContainerDetailsViewModel } from '@/docker/models/container';

import './createcontainer.css';
import { envVarsTabUtils } from '@/react/docker/containers/CreateView/EnvVarsTab';
import { getContainers } from '@/react/docker/containers/queries/containers';
import { resourcesTabUtils } from '@/react/docker/containers/CreateView/ResourcesTab';
import { restartPolicyTabUtils } from '@/react/docker/containers/CreateView/RestartPolicyTab';

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
    endpoint
  ) {
    $scope.create = create;
    $scope.endpoint = endpoint;
    $scope.containerWebhookFeature = FeatureId.CONTAINER_WEBHOOK;
    $scope.formValues = {
      alwaysPull: true,
      GPU: {
        enabled: false,
        useSpecific: false,
        selectedGPUs: ['all'],
        capabilities: ['compute', 'utility'],
      },
      Labels: [],
      ExtraHosts: [],
      MacAddress: '',
      IPv4: '',
      IPv6: '',
      DnsPrimary: '',
      DnsSecondary: '',
      AccessControlData: new AccessControlFormData(),
      NodeName: null,
      RegistryModel: new PorImageRegistryModel(),

      commands: commandsTabUtils.getDefaultViewModel(),
      envVars: envVarsTabUtils.getDefaultViewModel(),
      volumes: volumesTabUtils.getDefaultViewModel(),
      network: networkTabUtils.getDefaultViewModel(),
      resources: resourcesTabUtils.getDefaultViewModel(),
      capabilities: capabilitiesTabUtils.getDefaultViewModel(),
      restartPolicy: restartPolicyTabUtils.getDefaultViewModel(),
    };

    $scope.state = {
      formValidationError: '',
      actionInProgress: false,
      mode: '',
      pullImageValidity: true,
      settingUnlimitedResources: false,
      containerIsLoaded: false,
    };

    $scope.onAlwaysPullChange = onAlwaysPullChange;
    $scope.handlePublishAllPortsChange = handlePublishAllPortsChange;
    $scope.handleAutoRemoveChange = handleAutoRemoveChange;
    $scope.handlePrivilegedChange = handlePrivilegedChange;
    $scope.handleInitChange = handleInitChange;
    $scope.handleCommandsChange = handleCommandsChange;
    $scope.handleEnvVarsChange = handleEnvVarsChange;

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

    function onAlwaysPullChange(checked) {
      return $scope.$evalAsync(() => {
        $scope.formValues.alwaysPull = checked;
      });
    }

    function handlePublishAllPortsChange(checked) {
      return $scope.$evalAsync(() => {
        $scope.config.HostConfig.PublishAllPorts = checked;
      });
    }

    function handleAutoRemoveChange(checked) {
      return $scope.$evalAsync(() => {
        $scope.config.HostConfig.AutoRemove = checked;
      });
    }

    function handlePrivilegedChange(checked) {
      return $scope.$evalAsync(() => {
        $scope.config.HostConfig.Privileged = checked;
      });
    }

    function handleInitChange(checked) {
      return $scope.$evalAsync(() => {
        $scope.config.HostConfig.Init = checked;
      });
    }

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

    $scope.addPortBinding = function () {
      $scope.config.HostConfig.PortBindings.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
    };

    $scope.removePortBinding = function (index) {
      $scope.config.HostConfig.PortBindings.splice(index, 1);
    };

    $scope.addLabel = function () {
      $scope.formValues.Labels.push({ name: '', value: '' });
    };

    $scope.removeLabel = function (index) {
      $scope.formValues.Labels.splice(index, 1);
    };

    $scope.addExtraHost = function () {
      $scope.formValues.ExtraHosts.push({ value: '' });
    };

    $scope.removeExtraHost = function (index) {
      $scope.formValues.ExtraHosts.splice(index, 1);
    };

    $scope.addDevice = function () {
      $scope.config.HostConfig.Devices.push({ pathOnHost: '', pathInContainer: '' });
    };

    $scope.removeDevice = function (index) {
      $scope.config.HostConfig.Devices.splice(index, 1);
    };

    $scope.onGpuChange = function (values) {
      return $async(async () => {
        $scope.formValues.GPU = values;
      });
    };

    $scope.addSysctl = function () {
      $scope.formValues.Sysctls.push({ name: '', value: '' });
    };

    $scope.removeSysctl = function (index) {
      $scope.formValues.Sysctls.splice(index, 1);
    };

    $scope.fromContainerMultipleNetworks = false;

    function prepareImageConfig(config) {
      const imageConfig = ImageHelper.createImageConfigForContainer($scope.formValues.RegistryModel);
      config.Image = imageConfig.fromImage;
    }

    function preparePortBindings(config) {
      const bindings = ContainerHelper.preparePortBindings(config.HostConfig.PortBindings);
      config.ExposedPorts = {};
      _.forEach(bindings, (_, key) => (config.ExposedPorts[key] = {}));
      config.HostConfig.PortBindings = bindings;
    }

    function prepareLabels(config) {
      var labels = {};
      $scope.formValues.Labels.forEach(function (label) {
        if (label.name) {
          if (label.value) {
            labels[label.name] = label.value;
          } else {
            labels[label.name] = '';
          }
        }
      });
      config.Labels = labels;
    }

    function prepareConfiguration() {
      var config = angular.copy($scope.config);
      config = commandsTabUtils.toRequest(config, $scope.formValues.commands);
      config = envVarsTabUtils.toRequest(config, $scope.formValues.envVars);
      config = volumesTabUtils.toRequest(config, $scope.formValues.volumes);
      config = networkTabUtils.toRequest(config, $scope.formValues.network, $scope.fromContainer.Id);
      config = resourcesTabUtils.toRequest(config, $scope.formValues.resources);
      config = capabilitiesTabUtils.toRequest(config, $scope.formValues.capabilities);
      config = restartPolicyTabUtils.toRequest(config, $scope.formValues.restartPolicy);

      prepareImageConfig(config);
      preparePortBindings(config);
      prepareLabels(config);
      return config;
    }

    function loadFromContainerPortBindings() {
      const bindings = ContainerHelper.sortAndCombinePorts($scope.config.HostConfig.PortBindings);
      $scope.config.HostConfig.PortBindings = bindings;
    }

    function loadFromContainerLabels() {
      for (var l in $scope.config.Labels) {
        if ({}.hasOwnProperty.call($scope.config.Labels, l)) {
          $scope.formValues.Labels.push({ name: l, value: $scope.config.Labels[l] });
        }
      }
    }

    function loadFromContainerImageConfig() {
      RegistryService.retrievePorRegistryModelFromRepository($scope.config.Image, endpoint.Id)
        .then((model) => {
          $scope.formValues.RegistryModel = model;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve registry');
        });
    }

    function loadFromContainerSpec() {
      // Get container
      Container.get({ id: $transition$.params().from })
        .$promise.then(function success(d) {
          var fromContainer = new ContainerDetailsViewModel(d);
          if (fromContainer.ResourceControl) {
            if (fromContainer.ResourceControl.Public) {
              $scope.formValues.AccessControlData.AccessControlEnabled = false;
            }

            // When the container is create by duplicate/edit, the access permission
            // shouldn't be copied
            fromContainer.ResourceControl.UserAccesses = [];
            fromContainer.ResourceControl.TeamAccesses = [];
          }

          $scope.fromContainer = fromContainer;
          $scope.state.mode = 'duplicate';
          $scope.config = ContainerHelper.configFromContainer(angular.copy(d));

          $scope.formValues.commands = commandsTabUtils.toViewModel(d);
          $scope.formValues.envVars = envVarsTabUtils.toViewModel(d);
          $scope.formValues.volumes = volumesTabUtils.toViewModel(d);
          $scope.formValues.network = networkTabUtils.toViewModel(d, $scope.availableNetworks, $scope.runningContainers);
          $scope.formValues.resources = resourcesTabUtils.toViewModel(d);
          $scope.formValues.capabilities = capabilitiesTabUtils.toViewModel(d);

          $scope.formValues.restartPolicy = restartPolicyTabUtils.toViewModel(d);

          loadFromContainerPortBindings(d);
          loadFromContainerLabels(d);
          loadFromContainerImageConfig(d);
        })
        .then(() => {
          $scope.state.containerIsLoaded = true;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container');
        });
    }

    async function initView() {
      var nodeName = $transition$.params().nodeName;
      $scope.formValues.NodeName = nodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

      $scope.isAdmin = Authentication.isAdmin();
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

    function validateForm(accessControlData, isAdmin) {
      $scope.state.formValidationError = '';
      var error = '';
      error = FormValidator.validateAccessControl(accessControlData, isAdmin);

      if (error) {
        $scope.state.formValidationError = error;
        return false;
      }
      return true;
    }

    $scope.handleResourceChange = handleResourceChange;
    function handleResourceChange() {
      $scope.state.settingUnlimitedResources = false;
      if (
        ($scope.config.HostConfig.Memory > 0 && $scope.formValues.MemoryLimit === 0) ||
        ($scope.config.HostConfig.MemoryReservation > 0 && $scope.formValues.MemoryReservation === 0) ||
        ($scope.config.HostConfig.NanoCpus > 0 && $scope.formValues.CpuLimit === 0)
      ) {
        $scope.state.settingUnlimitedResources = true;
      }
    }

    $scope.redeployUnlimitedResources = function (resources) {
      return $async(async () => {
        $scope.formValues.resources = resources;
        return create();
      });
    };

    function create() {
      var oldContainer = null;
      HttpRequestHelper.setPortainerAgentTargetHeader($scope.formValues.NodeName);
      return findCurrentContainer().then(setOldContainer).then(confirmCreateContainer).then(startCreationProcess).catch(notifyOnError).finally(final);

      function final() {
        $scope.state.actionInProgress = false;
      }

      function setOldContainer(container) {
        oldContainer = container;
        return container;
      }

      function findCurrentContainer() {
        return Container.query({ all: 1, filters: { name: ['^/' + $scope.config.name + '$'] } })
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
        if (!validateAccessControl()) {
          return $q.when();
        }
        $scope.state.actionInProgress = true;
        return pullImageIfNeeded()
          .then(stopAndRenameContainer)
          .then(createNewContainer)
          .then(applyResourceControl)
          .then(connectToExtraNetworks)
          .then(removeOldContainer)
          .then(onSuccess)
          .catch(onCreationProcessFail);
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

      function pullImageIfNeeded() {
        return $q.when($scope.formValues.alwaysPull && ImageService.pullImage($scope.formValues.RegistryModel, true));
      }

      function createNewContainer() {
        return $async(async () => {
          const config = prepareConfiguration();
          return await ContainerService.createAndStartContainer(config);
        });
      }

      async function sendAnalytics() {
        const publicSettings = await SettingsService.publicSettings();
        const analyticsAllowed = publicSettings.EnableTelemetry;
        const image = `${$scope.formValues.RegistryModel.Registry.URL}/${$scope.formValues.RegistryModel.Image}`;
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
        const accessControlData = $scope.formValues.AccessControlData;

        return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl).then(function onApplyResourceControlSuccess() {
          return containerId;
        });
      }

      function connectToExtraNetworks(newContainerId) {
        if (!$scope.formValues.network.extraNetworks) {
          return $q.when();
        }

        var connectionPromises = _.forOwn($scope.formValues.network.extraNetworks, function (network, networkName) {
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

      function validateAccessControl() {
        var accessControlData = $scope.formValues.AccessControlData;
        return validateForm(accessControlData, $scope.isAdmin);
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

    initView();
  },
]);
