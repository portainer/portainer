require('./includes/configs.html');
require('./includes/constraints.html');
require('./includes/container-specs.html');
require('./includes/containerlabels.html');
require('./includes/environmentvariables.html');
require('./includes/hosts.html');
require('./includes/image.html');
require('./includes/logging.html');
require('./includes/mounts.html');
require('./includes/networks.html');
require('./includes/placementPreferences.html');
require('./includes/ports.html');
require('./includes/resources.html');
require('./includes/restart.html');
require('./includes/secrets.html');
require('./includes/servicelabels.html');
require('./includes/tasks.html');
require('./includes/updateconfig.html');

import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

angular.module('portainer.docker').controller('ServiceController', [
  '$q',
  '$scope',
  '$transition$',
  '$state',
  '$location',
  '$timeout',
  '$anchorScroll',
  'ServiceService',
  'ConfigService',
  'ConfigHelper',
  'SecretService',
  'ImageService',
  'SecretHelper',
  'Service',
  'ServiceHelper',
  'LabelHelper',
  'TaskService',
  'NodeService',
  'ContainerService',
  'TaskHelper',
  'Notifications',
  'ModalService',
  'PluginService',
  'Authentication',
  'SettingsService',
  'VolumeService',
  'ImageHelper',
  'WebhookService',
  'EndpointProvider',
  'clipboard',
  'WebhookHelper',
  'NetworkService',
  function (
    $q,
    $scope,
    $transition$,
    $state,
    $location,
    $timeout,
    $anchorScroll,
    ServiceService,
    ConfigService,
    ConfigHelper,
    SecretService,
    ImageService,
    SecretHelper,
    Service,
    ServiceHelper,
    LabelHelper,
    TaskService,
    NodeService,
    ContainerService,
    TaskHelper,
    Notifications,
    ModalService,
    PluginService,
    Authentication,
    SettingsService,
    VolumeService,
    ImageHelper,
    WebhookService,
    EndpointProvider,
    clipboard,
    WebhookHelper,
    NetworkService
  ) {
    $scope.state = {
      updateInProgress: false,
      deletionInProgress: false,
      rollbackInProgress: false,
    };

    $scope.formValues = {
      RegistryModel: new PorImageRegistryModel(),
    };

    $scope.tasks = [];
    $scope.availableImages = [];

    $scope.lastVersion = 0;

    var originalService = {};
    var previousServiceValues = [];

    $scope.goToItem = function (hash) {
      if ($location.hash() !== hash) {
        $location.hash(hash);
      } else {
        $anchorScroll();
      }
    };

    $scope.addEnvironmentVariable = function addEnvironmentVariable(service) {
      service.EnvironmentVariables.push({ key: '', value: '', originalValue: '' });
      updateServiceArray(service, 'EnvironmentVariables', service.EnvironmentVariables);
    };
    $scope.removeEnvironmentVariable = function removeEnvironmentVariable(service, index) {
      var removedElement = service.EnvironmentVariables.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'EnvironmentVariables', service.EnvironmentVariables);
      }
    };
    $scope.updateEnvironmentVariable = function updateEnvironmentVariable(service, variable) {
      if (variable.value !== variable.originalValue || variable.key !== variable.originalKey) {
        updateServiceArray(service, 'EnvironmentVariables', service.EnvironmentVariables);
      }
    };
    $scope.addConfig = function addConfig(service, config) {
      if (
        config &&
        service.ServiceConfigs.filter(function (serviceConfig) {
          return serviceConfig.Id === config.Id;
        }).length === 0
      ) {
        service.ServiceConfigs.push({ Id: config.Id, Name: config.Name, FileName: config.Name, Uid: '0', Gid: '0', Mode: 292 });
        updateServiceArray(service, 'ServiceConfigs', service.ServiceConfigs);
      }
    };
    $scope.removeConfig = function removeSecret(service, index) {
      var removedElement = service.ServiceConfigs.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceConfigs', service.ServiceConfigs);
      }
    };
    $scope.updateConfig = function updateConfig(service) {
      updateServiceArray(service, 'ServiceConfigs', service.ServiceConfigs);
    };
    $scope.addSecret = function addSecret(service, newSecret) {
      if (newSecret.secret) {
        var filename = newSecret.secret.Name;
        if (newSecret.override) {
          filename = newSecret.target;
        }
        if (
          service.ServiceSecrets.filter(function (serviceSecret) {
            return serviceSecret.Id === newSecret.secret.Id && serviceSecret.FileName === filename;
          }).length === 0
        ) {
          service.ServiceSecrets.push({ Id: newSecret.secret.Id, Name: newSecret.secret.Name, FileName: filename, Uid: '0', Gid: '0', Mode: 444 });
          updateServiceArray(service, 'ServiceSecrets', service.ServiceSecrets);
        }
      }
    };
    $scope.removeSecret = function removeSecret(service, index) {
      var removedElement = service.ServiceSecrets.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceSecrets', service.ServiceSecrets);
      }
    };
    $scope.addLabel = function addLabel(service) {
      service.ServiceLabels.push({ key: '', value: '', originalValue: '' });
      updateServiceArray(service, 'ServiceLabels', service.ServiceLabels);
    };
    $scope.removeLabel = function removeLabel(service, index) {
      var removedElement = service.ServiceLabels.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceLabels', service.ServiceLabels);
      }
    };
    $scope.updateLabel = function updateLabel(service, label) {
      if (label.value !== label.originalValue || label.key !== label.originalKey) {
        updateServiceArray(service, 'ServiceLabels', service.ServiceLabels);
      }
    };
    $scope.addContainerLabel = function addContainerLabel(service) {
      service.ServiceContainerLabels.push({ key: '', value: '', originalValue: '' });
      updateServiceArray(service, 'ServiceContainerLabels', service.ServiceContainerLabels);
    };
    $scope.removeContainerLabel = function removeLabel(service, index) {
      var removedElement = service.ServiceContainerLabels.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceContainerLabels', service.ServiceContainerLabels);
      }
    };
    $scope.updateContainerLabel = function updateLabel(service, label) {
      if (label.value !== label.originalValue || label.key !== label.originalKey) {
        updateServiceArray(service, 'ServiceContainerLabels', service.ServiceContainerLabels);
      }
    };
    $scope.addMount = function addMount(service) {
      service.ServiceMounts.push({ Type: 'volume', Source: '', Target: '', ReadOnly: false });
      updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
    };
    $scope.removeMount = function removeMount(service, index) {
      var removedElement = service.ServiceMounts.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
      }
    };
    $scope.updateMount = function updateMount(service) {
      updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
    };

    $scope.addNetwork = function addNetwork(service) {
      service.VirtualIPs.push({ NetworkID: '' });
      updateServiceArray(service, 'VirtualIPs', service.VirtualIPs);
    };
    $scope.removeNetwork = function removeNetwork(service, index) {
      var removedElement = service.VirtualIPs.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'VirtualIPs', service.VirtualIPs);
      }
    };
    $scope.updateNetwork = function updateNetwork(service) {
      updateServiceArray(service, 'VirtualIPs', service.VirtualIPs);
    };

    $scope.addPlacementConstraint = function addPlacementConstraint(service) {
      service.ServiceConstraints.push({ key: '', operator: '==', value: '' });
      updateServiceArray(service, 'ServiceConstraints', service.ServiceConstraints);
    };
    $scope.removePlacementConstraint = function removePlacementConstraint(service, index) {
      var removedElement = service.ServiceConstraints.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServiceConstraints', service.ServiceConstraints);
      }
    };
    $scope.updatePlacementConstraint = function (service) {
      updateServiceArray(service, 'ServiceConstraints', service.ServiceConstraints);
    };

    $scope.addPlacementPreference = function (service) {
      service.ServicePreferences.push({ strategy: 'spread', value: '' });
      updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
    };
    $scope.removePlacementPreference = function (service, index) {
      var removedElement = service.ServicePreferences.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
      }
    };
    $scope.updatePlacementPreference = function (service) {
      updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
    };

    $scope.addPublishedPort = function addPublishedPort(service) {
      if (!service.Ports) {
        service.Ports = [];
      }
      service.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp', PublishMode: 'ingress' });
    };
    $scope.updatePublishedPort = function updatePublishedPort(service) {
      updateServiceArray(service, 'Ports', service.Ports);
    };
    $scope.removePortPublishedBinding = function removePortPublishedBinding(service, index) {
      var removedElement = service.Ports.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'Ports', service.Ports);
      }
    };

    $scope.addLogDriverOpt = function addLogDriverOpt(service) {
      service.LogDriverOpts.push({ key: '', value: '', originalValue: '' });
      updateServiceArray(service, 'LogDriverOpts', service.LogDriverOpts);
    };
    $scope.removeLogDriverOpt = function removeLogDriverOpt(service, index) {
      var removedElement = service.LogDriverOpts.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'LogDriverOpts', service.LogDriverOpts);
      }
    };
    $scope.updateLogDriverOpt = function updateLogDriverOpt(service, variable) {
      if (variable.value !== variable.originalValue || variable.key !== variable.originalKey) {
        updateServiceArray(service, 'LogDriverOpts', service.LogDriverOpts);
      }
    };
    $scope.updateLogDriverName = function updateLogDriverName(service) {
      updateServiceArray(service, 'LogDriverName', service.LogDriverName);
    };

    $scope.addHostsEntry = function (service) {
      if (!service.Hosts) {
        service.Hosts = [];
      }
      service.Hosts.push({ hostname: '', ip: '' });
    };
    $scope.removeHostsEntry = function (service, index) {
      var removedElement = service.Hosts.splice(index, 1);
      if (removedElement !== null) {
        updateServiceArray(service, 'Hosts', service.Hosts);
      }
    };
    $scope.updateHostsEntry = function (service) {
      updateServiceArray(service, 'Hosts', service.Hosts);
    };

    $scope.updateWebhook = function updateWebhook(service) {
      if ($scope.WebhookExists) {
        WebhookService.deleteWebhook($scope.webhookID)
          .then(function success() {
            $scope.webhookURL = null;
            $scope.webhookID = null;
            $scope.WebhookExists = false;
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to delete webhook');
          });
      } else {
        WebhookService.createServiceWebhook(service.Id, EndpointProvider.endpointID())
          .then(function success(data) {
            $scope.WebhookExists = true;
            $scope.webhookID = data.Id;
            $scope.webhookURL = WebhookHelper.returnWebhookUrl(data.Token);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to create webhook');
          });
      }
    };

    $scope.copyWebhook = function copyWebhook() {
      clipboard.copyText($scope.webhookURL);
      $('#copyNotification').show();
      $('#copyNotification').fadeOut(2000);
    };

    $scope.cancelChanges = function cancelChanges(service, keys) {
      if (keys) {
        // clean out the keys only from the list of modified keys
        keys.forEach(function (key) {
          if (key === 'Image') {
            $scope.formValues.RegistryModel.Image = '';
          } else {
            var index = previousServiceValues.indexOf(key);
            if (index >= 0) {
              previousServiceValues.splice(index, 1);
            }
          }
        });
      } else {
        // clean out all changes
        $scope.formValues.RegistryModel.Image = '';
        keys = Object.keys(service);
        previousServiceValues = [];
      }
      keys.forEach(function (attribute) {
        service[attribute] = originalService[attribute]; // reset service values
      });
      service.hasChanges = false;
    };

    $scope.hasChanges = function (service, elements) {
      var hasChanges = false;
      elements.forEach(function (key) {
        if (key === 'Image') {
          hasChanges = hasChanges || $scope.formValues.RegistryModel.Image ? true : false;
        } else {
          hasChanges = hasChanges || previousServiceValues.indexOf(key) >= 0;
        }
      });
      return hasChanges;
    };

    function buildChanges(service) {
      var config = ServiceHelper.serviceToConfig(service.Model);
      config.Name = service.Name;
      config.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceLabels);
      config.TaskTemplate.ContainerSpec.Env = ServiceHelper.translateEnvironmentVariablesToEnv(service.EnvironmentVariables);
      config.TaskTemplate.ContainerSpec.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceContainerLabels);

      if ($scope.hasChanges(service, ['Image'])) {
        const image = ImageHelper.createImageConfigForContainer($scope.formValues.RegistryModel);
        config.TaskTemplate.ContainerSpec.Image = image.fromImage;
      } else {
        config.TaskTemplate.ContainerSpec.Image = service.Image;
      }

      config.TaskTemplate.ContainerSpec.Secrets = service.ServiceSecrets ? service.ServiceSecrets.map(SecretHelper.secretConfig) : [];
      config.TaskTemplate.ContainerSpec.Configs = service.ServiceConfigs ? service.ServiceConfigs.map(ConfigHelper.configConfig) : [];
      config.TaskTemplate.ContainerSpec.Hosts = service.Hosts ? ServiceHelper.translateHostnameIPToHostsEntries(service.Hosts) : [];

      if (service.Mode === 'replicated') {
        config.Mode.Replicated.Replicas = service.Replicas;
      }
      config.TaskTemplate.ContainerSpec.Mounts = service.ServiceMounts;
      if (typeof config.TaskTemplate.Placement === 'undefined') {
        config.TaskTemplate.Placement = {};
      }
      config.TaskTemplate.Placement.Constraints = ServiceHelper.translateKeyValueToPlacementConstraints(service.ServiceConstraints);
      config.TaskTemplate.Placement.Preferences = ServiceHelper.translateKeyValueToPlacementPreferences(service.ServicePreferences);

      if ($scope.hasChanges(service, ['LimitNanoCPUs', 'LimitMemoryBytes', 'ReservationNanoCPUs', 'ReservationMemoryBytes'])) {
        // Round memory values to 0.125 and convert MB to B
        var memoryLimit = (Math.round(service.LimitMemoryBytes * 8) / 8).toFixed(3);
        memoryLimit *= 1024 * 1024;
        var memoryReservation = (Math.round(service.ReservationMemoryBytes * 8) / 8).toFixed(3);
        memoryReservation *= 1024 * 1024;
        config.TaskTemplate.Resources = {
          Limits: {
            NanoCPUs: service.LimitNanoCPUs * 1000000000,
            MemoryBytes: memoryLimit,
          },
          Reservations: {
            NanoCPUs: service.ReservationNanoCPUs * 1000000000,
            MemoryBytes: memoryReservation,
          },
        };
      }

      if ($scope.hasChanges(service, ['UpdateFailureAction', 'UpdateDelay', 'UpdateParallelism', 'UpdateOrder'])) {
        config.UpdateConfig = {
          Parallelism: service.UpdateParallelism,
          Delay: ServiceHelper.translateHumanDurationToNanos(service.UpdateDelay) || 0,
          FailureAction: service.UpdateFailureAction,
          Order: service.UpdateOrder,
        };
      }

      if ($scope.hasChanges(service, ['RestartCondition', 'RestartDelay', 'RestartMaxAttempts', 'RestartWindow'])) {
        config.TaskTemplate.RestartPolicy = {
          Condition: service.RestartCondition,
          Delay: ServiceHelper.translateHumanDurationToNanos(service.RestartDelay) || 5000000000,
          MaxAttempts: service.RestartMaxAttempts,
          Window: ServiceHelper.translateHumanDurationToNanos(service.RestartWindow) || 0,
        };
      }

      config.TaskTemplate.LogDriver = null;
      if (service.LogDriverName) {
        config.TaskTemplate.LogDriver = { Name: service.LogDriverName };
        if (service.LogDriverName !== 'none') {
          var logOpts = ServiceHelper.translateKeyValueToLogDriverOpts(service.LogDriverOpts);
          if (Object.keys(logOpts).length !== 0 && logOpts.constructor === Object) {
            config.TaskTemplate.LogDriver.Options = logOpts;
          }
        }
      }

      if (service.Ports) {
        service.Ports.forEach(function (binding) {
          if (binding.PublishedPort === null || binding.PublishedPort === '') {
            delete binding.PublishedPort;
          }
        });
      }

      config.EndpointSpec = {
        Mode: (config.EndpointSpec && config.EndpointSpec.Mode) || 'vip',
        Ports: service.Ports,
      };
      return service, config;
    }

    function rollbackService(service) {
      $scope.state.rollbackInProgress = true;
      let config = {};
      service, (config = buildChanges(service));
      ServiceService.update(service, config, 'previous')
        .then(function (data) {
          if (data.message && data.message.match(/^rpc error:/)) {
            Notifications.error(data.message, 'Error');
          } else {
            Notifications.success('Success', 'Service successfully rolled back');
            $scope.cancelChanges({});
            initView();
          }
        })
        .catch(function (e) {
          if (e.data.message && e.data.message.includes('does not have a previous spec')) {
            Notifications.error('Failure', { message: 'No previous config to rollback to.' });
          } else {
            Notifications.error('Failure', e, 'Unable to rollback service');
          }
        })
        .finally(function () {
          $scope.state.rollbackInProgress = false;
        });
    }

    $scope.rollbackService = function (service) {
      ModalService.confirm({
        title: 'Rollback service',
        message: 'Are you sure you want to rollback?',
        buttons: {
          confirm: {
            label: 'Yes',
            className: 'btn-danger',
          },
        },
        callback: function onConfirm(confirmed) {
          if (!confirmed) {
            return;
          }
          rollbackService(service);
        },
      });
    };

    $scope.updateService = function updateService(service) {
      let config = {};
      service, (config = buildChanges(service));
      ServiceService.update(service, config).then(
        function (data) {
          if (data.message && data.message.match(/^rpc error:/)) {
            Notifications.error(data.message, 'Error');
          } else {
            Notifications.success('Service successfully updated', 'Service updated');
          }
          $scope.cancelChanges({});
          initView();
        },
        function (e) {
          Notifications.error('Failure', e, 'Unable to update service');
        }
      );
    };

    $scope.removeService = function () {
      ModalService.confirmDeletion('Do you want to remove this service? All the containers associated to this service will be removed too.', function onConfirm(confirmed) {
        if (!confirmed) {
          return;
        }
        removeService();
      });
    };

    function removeService() {
      $scope.state.deletionInProgress = true;
      ServiceService.remove($scope.service)
        .then(function success() {
          return $q.when($scope.webhookID && WebhookService.deleteWebhook($scope.webhookID));
        })
        .then(function success() {
          Notifications.success('Service successfully deleted');
          $state.go('docker.services', {});
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove service');
        })
        .finally(function final() {
          $scope.state.deletionInProgress = false;
        });
    }

    $scope.forceUpdateService = function (service) {
      ModalService.confirmServiceForceUpdate('Do you want to force an update of the service? All the tasks associated to the service will be recreated.', function (result) {
        if (!result) {
          return;
        }
        var pullImage = false;
        if (result[0]) {
          pullImage = true;
        }
        forceUpdateService(service, pullImage);
      });
    };

    function forceUpdateService(service, pullImage) {
      var config = ServiceHelper.serviceToConfig(service.Model);
      if (pullImage) {
        config.TaskTemplate.ContainerSpec.Image = ImageHelper.removeDigestFromRepository(config.TaskTemplate.ContainerSpec.Image);
      }

      // As explained in https://github.com/docker/swarmkit/issues/2364 ForceUpdate can accept a random
      // value or an increment of the counter value to force an update.
      config.TaskTemplate.ForceUpdate++;
      $scope.state.updateInProgress = true;
      ServiceService.update(service, config)
        .then(function success() {
          Notifications.success('Service successfully updated', service.Name);
          $scope.cancelChanges({});
          initView();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to force update service', service.Name);
        })
        .finally(function final() {
          $scope.state.updateInProgress = false;
        });
    }

    function translateServiceArrays(service) {
      service.ServiceSecrets = service.Secrets ? service.Secrets.map(SecretHelper.flattenSecret) : [];
      service.ServiceConfigs = service.Configs ? service.Configs.map(ConfigHelper.flattenConfig) : [];
      service.EnvironmentVariables = ServiceHelper.translateEnvironmentVariables(service.Env);
      service.LogDriverOpts = ServiceHelper.translateLogDriverOptsToKeyValue(service.LogDriverOpts);
      service.ServiceLabels = LabelHelper.fromLabelHashToKeyValue(service.Labels);
      service.ServiceContainerLabels = LabelHelper.fromLabelHashToKeyValue(service.ContainerLabels);
      service.ServiceMounts = angular.copy(service.Mounts);
      service.ServiceConstraints = ServiceHelper.translateConstraintsToKeyValue(service.Constraints);
      service.ServicePreferences = ServiceHelper.translatePreferencesToKeyValue(service.Preferences);
      service.Hosts = ServiceHelper.translateHostsEntriesToHostnameIP(service.Hosts);
    }

    function transformResources(service) {
      service.LimitNanoCPUs = service.LimitNanoCPUs / 1000000000 || 0;
      service.ReservationNanoCPUs = service.ReservationNanoCPUs / 1000000000 || 0;
      service.LimitMemoryBytes = service.LimitMemoryBytes / 1024 / 1024 || 0;
      service.ReservationMemoryBytes = service.ReservationMemoryBytes / 1024 / 1024 || 0;
    }

    function transformDurations(service) {
      service.RestartDelay = ServiceHelper.translateNanosToHumanDuration(service.RestartDelay) || '5s';
      service.RestartWindow = ServiceHelper.translateNanosToHumanDuration(service.RestartWindow) || '0s';
      service.UpdateDelay = ServiceHelper.translateNanosToHumanDuration(service.UpdateDelay) || '0s';
      service.StopGracePeriod = service.StopGracePeriod ? ServiceHelper.translateNanosToHumanDuration(service.StopGracePeriod) : '';
    }

    function initView() {
      var apiVersion = $scope.applicationState.endpoint.apiVersion;
      var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

      var service = null;
      ServiceService.service($transition$.params().id)
        .then(function success(data) {
          service = data;
          $scope.isUpdating = $scope.lastVersion >= service.Version;
          if (!$scope.isUpdating) {
            $scope.lastVersion = service.Version;
          }

          transformResources(service);
          translateServiceArrays(service);
          transformDurations(service);
          $scope.service = service;
          originalService = angular.copy(service);

          return $q.all({
            volumes: VolumeService.volumes(),
            tasks: TaskService.tasks({ service: [service.Name] }),
            containers: agentProxy ? ContainerService.containers() : [],
            nodes: NodeService.nodes(),
            secrets: apiVersion >= 1.25 ? SecretService.secrets() : [],
            configs: apiVersion >= 1.3 ? ConfigService.configs() : [],
            availableImages: ImageService.images(),
            availableLoggingDrivers: PluginService.loggingPlugins(apiVersion < 1.25),
            availableNetworks: NetworkService.networks(true, true, apiVersion >= 1.25),
            settings: SettingsService.publicSettings(),
            webhooks: WebhookService.webhooks(service.Id, EndpointProvider.endpointID()),
          });
        })
        .then(function success(data) {
          $scope.nodes = data.nodes;
          $scope.configs = data.configs;
          $scope.secrets = data.secrets;
          $scope.availableImages = ImageService.getUniqueTagListFromImages(data.availableImages);
          $scope.availableLoggingDrivers = data.availableLoggingDrivers;
          $scope.availableVolumes = data.volumes;
          $scope.allowBindMounts = data.settings.AllowBindMountsForRegularUsers;
          $scope.isAdmin = Authentication.isAdmin();
          $scope.availableNetworks = data.availableNetworks;
          $scope.networks = _.filter($scope.availableNetworks, (network) => {
            const find = _.find($scope.service.VirtualIPs, (vip) => {
              return vip.NetworkID === network.Id;
            });
            return find;
          });

          if (data.webhooks.length > 0) {
            var webhook = data.webhooks[0];
            $scope.WebhookExists = true;
            $scope.webhookID = webhook.Id;
            $scope.webhookURL = WebhookHelper.returnWebhookUrl(webhook.Token);
          }

          var tasks = data.tasks;

          if (agentProxy) {
            var containers = data.containers;
            for (var i = 0; i < tasks.length; i++) {
              var task = tasks[i];
              TaskHelper.associateContainerToTask(task, containers);
            }
          }

          ServiceHelper.associateTasksToService(service, tasks);

          $scope.tasks = data.tasks;

          // Set max cpu value
          var maxCpus = 0;
          for (var n in data.nodes) {
            if (data.nodes[n].CPUs && data.nodes[n].CPUs > maxCpus) {
              maxCpus = data.nodes[n].CPUs;
            }
          }
          if (maxCpus > 0) {
            $scope.state.sliderMaxCpu = maxCpus / 1000000000;
          } else {
            $scope.state.sliderMaxCpu = 32;
          }

          // Default values
          $scope.state.addSecret = { override: false };

          $timeout(function () {
            $anchorScroll();
          });
        })
        .catch(function error(err) {
          $scope.secrets = [];
          $scope.configs = [];
          Notifications.error('Failure', err, 'Unable to retrieve service details');
        });
    }

    $scope.updateServiceAttribute = updateServiceAttribute;
    function updateServiceAttribute(service, name) {
      if (service[name] !== originalService[name] || !(name in originalService)) {
        service.hasChanges = true;
      }
      previousServiceValues.push(name);
    }

    function updateServiceArray(service, name) {
      previousServiceValues.push(name);
      service.hasChanges = true;
    }

    initView();
  },
]);
