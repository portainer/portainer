import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { AccessControlFormData } from '../../../../portainer/components/accessControlForm/porAccessControlFormModel';

require('./includes/update-restart.html');
require('./includes/secret.html');
require('./includes/config.html');
require('./includes/resources-placement.html');

angular.module('portainer.docker').controller('CreateServiceController', [
  '$q',
  '$scope',
  '$state',
  '$timeout',
  'Service',
  'ServiceHelper',
  'ConfigService',
  'ConfigHelper',
  'SecretHelper',
  'SecretService',
  'VolumeService',
  'NetworkService',
  'ImageHelper',
  'LabelHelper',
  'Authentication',
  'ResourceControlService',
  'Notifications',
  'FormValidator',
  'PluginService',
  'RegistryService',
  'HttpRequestHelper',
  'NodeService',
  'WebhookService',
  'endpoint',
  function (
    $q,
    $scope,
    $state,
    $timeout,
    Service,
    ServiceHelper,
    ConfigService,
    ConfigHelper,
    SecretHelper,
    SecretService,
    VolumeService,
    NetworkService,
    ImageHelper,
    LabelHelper,
    Authentication,
    ResourceControlService,
    Notifications,
    FormValidator,
    PluginService,
    RegistryService,
    HttpRequestHelper,
    NodeService,
    WebhookService,
    endpoint
  ) {
    $scope.endpoint = endpoint;

    $scope.formValues = {
      Name: '',
      RegistryModel: new PorImageRegistryModel(),
      Mode: 'replicated',
      Replicas: 1,
      Command: '',
      EntryPoint: '',
      WorkingDir: '',
      User: '',
      Env: [],
      Labels: [],
      ContainerLabels: [],
      Volumes: [],
      Network: '',
      ExtraNetworks: [],
      HostsEntries: [],
      Ports: [],
      Parallelism: 1,
      PlacementConstraints: [],
      PlacementPreferences: [],
      UpdateDelay: '0s',
      UpdateOrder: 'stop-first',
      FailureAction: 'pause',
      Secrets: [],
      Configs: [],
      AccessControlData: new AccessControlFormData(),
      CpuLimit: 0,
      CpuReservation: 0,
      MemoryLimit: 0,
      MemoryReservation: 0,
      MemoryLimitUnit: 'MB',
      MemoryReservationUnit: 'MB',
      RestartCondition: 'any',
      RestartDelay: '5s',
      RestartMaxAttempts: 0,
      RestartWindow: '0s',
      LogDriverName: '',
      LogDriverOpts: [],
      Webhook: false,
    };

    $scope.state = {
      formValidationError: '',
      actionInProgress: false,
    };

    $scope.allowBindMounts = false;

    $scope.refreshSlider = function () {
      $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
      });
    };

    $scope.addPortBinding = function () {
      $scope.formValues.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp', PublishMode: 'ingress' });
    };

    $scope.removePortBinding = function (index) {
      $scope.formValues.Ports.splice(index, 1);
    };

    $scope.addExtraNetwork = function () {
      $scope.formValues.ExtraNetworks.push({ Name: '' });
    };

    $scope.removeExtraNetwork = function (index) {
      $scope.formValues.ExtraNetworks.splice(index, 1);
    };

    $scope.addHostsEntry = function () {
      $scope.formValues.HostsEntries.push({});
    };

    $scope.removeHostsEntry = function (index) {
      $scope.formValues.HostsEntries.splice(index, 1);
    };

    $scope.addVolume = function () {
      $scope.formValues.Volumes.push({ Source: null, Target: '', ReadOnly: false, Type: 'volume' });
    };

    $scope.removeVolume = function (index) {
      $scope.formValues.Volumes.splice(index, 1);
    };

    $scope.addConfig = function () {
      $scope.formValues.Configs.push({});
    };

    $scope.removeConfig = function (index) {
      $scope.formValues.Configs.splice(index, 1);
    };

    $scope.addSecret = function () {
      $scope.formValues.Secrets.push({ overrideTarget: false });
    };

    $scope.removeSecret = function (index) {
      $scope.formValues.Secrets.splice(index, 1);
    };

    $scope.addEnvironmentVariable = function () {
      $scope.formValues.Env.push({ name: '', value: '' });
    };

    $scope.removeEnvironmentVariable = function (index) {
      $scope.formValues.Env.splice(index, 1);
    };

    $scope.addPlacementConstraint = function () {
      $scope.formValues.PlacementConstraints.push({ key: '', operator: '==', value: '' });
    };

    $scope.removePlacementConstraint = function (index) {
      $scope.formValues.PlacementConstraints.splice(index, 1);
    };

    $scope.addPlacementPreference = function () {
      $scope.formValues.PlacementPreferences.push({ strategy: 'spread', value: '' });
    };

    $scope.removePlacementPreference = function (index) {
      $scope.formValues.PlacementPreferences.splice(index, 1);
    };

    $scope.addLabel = function () {
      $scope.formValues.Labels.push({ key: '', value: '' });
    };

    $scope.removeLabel = function (index) {
      $scope.formValues.Labels.splice(index, 1);
    };

    $scope.addContainerLabel = function () {
      $scope.formValues.ContainerLabels.push({ key: '', value: '' });
    };

    $scope.removeContainerLabel = function (index) {
      $scope.formValues.ContainerLabels.splice(index, 1);
    };

    $scope.addLogDriverOpt = function () {
      $scope.formValues.LogDriverOpts.push({ name: '', value: '' });
    };

    $scope.removeLogDriverOpt = function (index) {
      $scope.formValues.LogDriverOpts.splice(index, 1);
    };

    function prepareImageConfig(config, input) {
      var imageConfig = ImageHelper.createImageConfigForContainer(input.RegistryModel);
      config.TaskTemplate.ContainerSpec.Image = imageConfig.fromImage;
    }

    function preparePortsConfig(config, input) {
      let ports = [];
      input.Ports.forEach(function (binding) {
        const port = {
          Protocol: binding.Protocol,
          PublishMode: binding.PublishMode,
        };
        if (binding.TargetPort) {
          port.TargetPort = +binding.TargetPort;
          if (binding.PublishedPort) {
            port.PublishedPort = +binding.PublishedPort;
          }
          ports.push(port);
        }
      });
      config.EndpointSpec.Ports = ports;
    }

    function prepareSchedulingConfig(config, input) {
      if (input.Mode === 'replicated') {
        config.Mode.Replicated = {
          Replicas: input.Replicas,
        };
      } else {
        config.Mode.Global = {};
      }
    }

    function commandToArray(cmd) {
      var tokens = [].concat
        .apply(
          [],
          cmd.split("'").map(function (v, i) {
            return i % 2 ? v : v.split(' ');
          })
        )
        .filter(Boolean);
      return tokens;
    }

    function prepareCommandConfig(config, input) {
      if (input.EntryPoint) {
        config.TaskTemplate.ContainerSpec.Command = commandToArray(input.EntryPoint);
      }
      if (input.Command) {
        config.TaskTemplate.ContainerSpec.Args = commandToArray(input.Command);
      }
      if (input.User) {
        config.TaskTemplate.ContainerSpec.User = input.User;
      }
      if (input.WorkingDir) {
        config.TaskTemplate.ContainerSpec.Dir = input.WorkingDir;
      }
    }

    function prepareEnvConfig(config, input) {
      var env = [];
      input.Env.forEach(function (v) {
        if (v.name) {
          env.push(v.name + '=' + v.value);
        }
      });
      config.TaskTemplate.ContainerSpec.Env = env;
    }

    function prepareLabelsConfig(config, input) {
      config.Labels = LabelHelper.fromKeyValueToLabelHash(input.Labels);
      config.TaskTemplate.ContainerSpec.Labels = LabelHelper.fromKeyValueToLabelHash(input.ContainerLabels);
    }

    function createMountObjectFromVolume(volumeObject, target, readonly) {
      return {
        Target: target,
        Source: volumeObject.Id,
        Type: 'volume',
        ReadOnly: readonly,
        VolumeOptions: {
          Labels: volumeObject.Labels,
          DriverConfig: {
            Name: volumeObject.Driver,
            Options: volumeObject.Options,
          },
        },
      };
    }

    function prepareVolumes(config, input) {
      input.Volumes.forEach(function (volume) {
        if (volume.Source && volume.Target) {
          if (volume.Type !== 'volume') {
            config.TaskTemplate.ContainerSpec.Mounts.push(volume);
          } else {
            var volumeObject = volume.Source;
            var mount = createMountObjectFromVolume(volumeObject, volume.Target, volume.ReadOnly);
            config.TaskTemplate.ContainerSpec.Mounts.push(mount);
          }
        }
      });
    }

    function prepareNetworks(config, input) {
      var networks = [];
      if (input.Network) {
        networks.push({ Target: input.Network });
      }
      input.ExtraNetworks.forEach(function (network) {
        networks.push({ Target: network.Name });
      });
      config.Networks = _.uniqWith(networks, _.isEqual);
    }

    function prepareHostsEntries(config, input) {
      var hostsEntries = [];
      if (input.HostsEntries) {
        input.HostsEntries.forEach(function (host_ip) {
          if (host_ip.value && host_ip.value.indexOf(':') && host_ip.value.split(':').length === 2) {
            var keyVal = host_ip.value.split(':');
            // Hosts file format, IP_address canonical_hostname
            hostsEntries.push(keyVal[1] + ' ' + keyVal[0]);
          }
        });
        if (hostsEntries.length > 0) {
          config.TaskTemplate.ContainerSpec.Hosts = hostsEntries;
        }
      }
    }

    function prepareUpdateConfig(config, input) {
      config.UpdateConfig = {
        Parallelism: input.Parallelism || 0,
        Delay: ServiceHelper.translateHumanDurationToNanos(input.UpdateDelay) || 0,
        FailureAction: input.FailureAction,
        Order: input.UpdateOrder,
      };
    }

    function prepareRestartPolicy(config, input) {
      config.TaskTemplate.RestartPolicy = {
        Condition: input.RestartCondition || 'any',
        Delay: ServiceHelper.translateHumanDurationToNanos(input.RestartDelay) || 5000000000,
        MaxAttempts: input.RestartMaxAttempts || 0,
        Window: ServiceHelper.translateHumanDurationToNanos(input.RestartWindow) || 0,
      };
    }

    function preparePlacementConfig(config, input) {
      config.TaskTemplate.Placement.Constraints = ServiceHelper.translateKeyValueToPlacementConstraints(input.PlacementConstraints);
      config.TaskTemplate.Placement.Preferences = ServiceHelper.translateKeyValueToPlacementPreferences(input.PlacementPreferences);
    }

    function prepareConfigConfig(config, input) {
      if (input.Configs) {
        var configs = [];
        angular.forEach(input.Configs, function (config) {
          if (config.model) {
            var s = ConfigHelper.configConfig(config.model);
            s.File.Name = config.FileName || s.File.Name;
            configs.push(s);
          }
        });
        config.TaskTemplate.ContainerSpec.Configs = configs;
      }
    }

    function prepareSecretConfig(config, input) {
      if (input.Secrets) {
        var secrets = [];
        angular.forEach(input.Secrets, function (secret) {
          if (secret.model) {
            var s = SecretHelper.secretConfig(secret.model);
            s.File.Name = s.SecretName;
            if (secret.overrideTarget && secret.target && secret.target !== '') {
              s.File.Name = secret.target;
            }
            secrets.push(s);
          }
        });
        config.TaskTemplate.ContainerSpec.Secrets = secrets;
      }
    }

    function prepareResourcesCpuConfig(config, input) {
      // CPU Limit
      if (input.CpuLimit > 0) {
        config.TaskTemplate.Resources.Limits.NanoCPUs = input.CpuLimit * 1000000000;
      }
      // CPU Reservation
      if (input.CpuReservation > 0) {
        config.TaskTemplate.Resources.Reservations.NanoCPUs = input.CpuReservation * 1000000000;
      }
    }

    function prepareResourcesMemoryConfig(config, input) {
      // Memory Limit - Round to 0.125
      var memoryLimit = (Math.round(input.MemoryLimit * 8) / 8).toFixed(3);
      memoryLimit *= 1024 * 1024;
      if (input.MemoryLimitUnit === 'GB') {
        memoryLimit *= 1024;
      }
      if (memoryLimit > 0) {
        config.TaskTemplate.Resources.Limits.MemoryBytes = memoryLimit;
      }
      // Memory Resevation - Round to 0.125
      var memoryReservation = (Math.round(input.MemoryReservation * 8) / 8).toFixed(3);
      memoryReservation *= 1024 * 1024;
      if (input.MemoryReservationUnit === 'GB') {
        memoryReservation *= 1024;
      }
      if (memoryReservation > 0) {
        config.TaskTemplate.Resources.Reservations.MemoryBytes = memoryReservation;
      }
    }

    function prepareLogDriverConfig(config, input) {
      var logOpts = {};
      if (input.LogDriverName) {
        config.TaskTemplate.LogDriver = { Name: input.LogDriverName };
        if (input.LogDriverName !== 'none') {
          input.LogDriverOpts.forEach(function (opt) {
            if (opt.name) {
              logOpts[opt.name] = opt.value;
            }
          });
          if (Object.keys(logOpts).length !== 0 && logOpts.constructor === Object) {
            config.TaskTemplate.LogDriver.Options = logOpts;
          }
        }
      }
    }

    function prepareConfiguration() {
      var input = $scope.formValues;
      var config = {
        Name: input.Name,
        TaskTemplate: {
          ContainerSpec: {
            Mounts: [],
          },
          Placement: {},
          Resources: {
            Limits: {},
            Reservations: {},
          },
        },
        Mode: {},
        EndpointSpec: {},
      };
      prepareSchedulingConfig(config, input);
      prepareImageConfig(config, input);
      preparePortsConfig(config, input);
      prepareCommandConfig(config, input);
      prepareEnvConfig(config, input);
      prepareLabelsConfig(config, input);
      prepareVolumes(config, input);
      prepareNetworks(config, input);
      prepareHostsEntries(config, input);
      prepareUpdateConfig(config, input);
      prepareConfigConfig(config, input);
      prepareSecretConfig(config, input);
      preparePlacementConfig(config, input);
      prepareResourcesCpuConfig(config, input);
      prepareResourcesMemoryConfig(config, input);
      prepareRestartPolicy(config, input);
      prepareLogDriverConfig(config, input);
      return config;
    }

    function createNewService(config, accessControlData) {
      const registryModel = $scope.formValues.RegistryModel;
      var authenticationDetails = registryModel.Registry.Authentication ? RegistryService.encodedCredentials(registryModel.Registry) : '';
      HttpRequestHelper.setRegistryAuthenticationHeader(authenticationDetails);

      Service.create(config)
        .$promise.then(function success(data) {
          const serviceId = data.ID;
          const resourceControl = data.Portainer.ResourceControl;
          const userId = Authentication.getUserDetails().ID;
          const rcPromise = ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
          const webhookPromise = $q.when(endpoint.Type !== 4 && $scope.formValues.Webhook && WebhookService.createServiceWebhook(serviceId, endpoint.ID));
          return $q.all([rcPromise, webhookPromise]);
        })
        .then(function success() {
          Notifications.success('Service successfully created');
          $state.go('docker.services', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create service');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
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

    $scope.volumesAreValid = volumesAreValid;
    function volumesAreValid() {
      const volumes = $scope.formValues.Volumes;
      return volumes.every((volume) => volume.Target && volume.Source);
    }

    $scope.create = function createService() {
      var accessControlData = $scope.formValues.AccessControlData;

      if (!validateForm(accessControlData, $scope.isAdmin)) {
        return;
      }

      $scope.state.actionInProgress = true;
      var config = prepareConfiguration();
      createNewService(config, accessControlData);
    };

    function initSlidersMaxValuesBasedOnNodeData(nodes) {
      var maxCpus = 0;
      var maxMemory = 0;
      for (var n in nodes) {
        if (nodes[n].CPUs && nodes[n].CPUs > maxCpus) {
          maxCpus = nodes[n].CPUs;
        }
        if (nodes[n].Memory && nodes[n].Memory > maxMemory) {
          maxMemory = nodes[n].Memory;
        }
      }
      if (maxCpus > 0) {
        $scope.state.sliderMaxCpu = maxCpus / 1000000000;
      } else {
        $scope.state.sliderMaxCpu = 32;
      }
      if (maxMemory > 0) {
        $scope.state.sliderMaxMemory = Math.floor(maxMemory / 1000 / 1000);
      } else {
        $scope.state.sliderMaxMemory = 32768;
      }
    }

    function initView() {
      var apiVersion = $scope.applicationState.endpoint.apiVersion;

      $q.all({
        volumes: VolumeService.volumes(),
        networks: NetworkService.networks(true, true, false),
        secrets: apiVersion >= 1.25 ? SecretService.secrets() : [],
        configs: apiVersion >= 1.3 ? ConfigService.configs() : [],
        nodes: NodeService.nodes(),
        availableLoggingDrivers: PluginService.loggingPlugins(apiVersion < 1.25),
        allowBindMounts: checkIfAllowedBindMounts(),
      })
        .then(function success(data) {
          $scope.availableVolumes = data.volumes;
          $scope.availableNetworks = data.networks;
          $scope.availableSecrets = data.secrets;
          $scope.availableConfigs = data.configs;
          $scope.availableLoggingDrivers = data.availableLoggingDrivers;
          initSlidersMaxValuesBasedOnNodeData(data.nodes);
          $scope.isAdmin = Authentication.isAdmin();
          $scope.allowBindMounts = data.allowBindMounts;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to initialize view');
        });
    }

    initView();

    async function checkIfAllowedBindMounts() {
      const isAdmin = Authentication.isAdmin();

      const { allowBindMountsForRegularUsers } = endpoint.SecuritySettings;

      return isAdmin || allowBindMountsForRegularUsers;
    }
  },
]);
