angular.module('portainer.docker')
.controller('ServiceController', ['$q', '$scope', '$transition$', '$state', '$location', '$timeout', '$anchorScroll', 'ServiceService', 'ConfigService', 'ConfigHelper', 'SecretService', 'ImageService', 'SecretHelper', 'Service', 'ServiceHelper', 'LabelHelper', 'TaskService', 'NodeService', 'Notifications', 'ModalService', 'PluginService',
function ($q, $scope, $transition$, $state, $location, $timeout, $anchorScroll, ServiceService, ConfigService, ConfigHelper, SecretService, ImageService, SecretHelper, Service, ServiceHelper, LabelHelper, TaskService, NodeService, Notifications, ModalService, PluginService) {

  $scope.state = {
    updateInProgress: false,
    deletionInProgress: false
  };

  $scope.tasks = [];
  $scope.availableImages = [];

  $scope.lastVersion = 0;

  var originalService = {};
  var previousServiceValues = [];

  $scope.renameService = function renameService(service) {
    updateServiceAttribute(service, 'Name', service.newServiceName || service.name);
    service.EditName = false;
  };
  $scope.changeServiceImage = function changeServiceImage(service) {
    updateServiceAttribute(service, 'Image', service.newServiceImage || service.image);
    service.EditImage = false;
  };
  $scope.scaleService = function scaleService(service) {
    var replicas = service.newServiceReplicas === null || isNaN(service.newServiceReplicas) ? service.Replicas : service.newServiceReplicas;
    updateServiceAttribute(service, 'Replicas', replicas);
    service.EditReplicas = false;
  };

  $scope.goToItem = function(hash) {
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
    if (config && service.ServiceConfigs.filter(function(serviceConfig) { return serviceConfig.Id === config.Id;}).length === 0) {
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
      if (service.ServiceSecrets.filter(function(serviceSecret) { return serviceSecret.Id === newSecret.secret.Id && serviceSecret.FileName === filename;}).length === 0) {
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
    service.ServiceMounts.push({Type: 'volume', Source: '', Target: '', ReadOnly: false });
    updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
  };
  $scope.removeMount = function removeMount(service, index) {
    var removedElement = service.ServiceMounts.splice(index, 1);
    if (removedElement !== null) {
      updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
    }
  };
  $scope.updateMount = function updateMount(service, mount) {
    updateServiceArray(service, 'ServiceMounts', service.ServiceMounts);
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
  $scope.updatePlacementConstraint = function(service, constraint) {
    updateServiceArray(service, 'ServiceConstraints', service.ServiceConstraints);
  };

  $scope.addPlacementPreference = function(service) {
    service.ServicePreferences.push({ strategy: 'spread', value: '' });
    updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
  };
  $scope.removePlacementPreference = function(service, index) {
    var removedElement = service.ServicePreferences.splice(index, 1);
    if (removedElement !== null) {
      updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
    }
  };
  $scope.updatePlacementPreference = function(service, constraint) {
    updateServiceArray(service, 'ServicePreferences', service.ServicePreferences);
  };

  $scope.addPublishedPort = function addPublishedPort(service) {
    if (!service.Ports) {
      service.Ports = [];
    }
    service.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp', PublishMode: 'ingress' });
  };
  $scope.updatePublishedPort = function updatePublishedPort(service, portMapping) {
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
  $scope.removeHostsEntry = function(service, index) {
    var removedElement = service.Hosts.splice(index, 1);
    if (removedElement !== null) {
      updateServiceArray(service, 'Hosts', service.Hosts);
    }
  };
  $scope.updateHostsEntry = function(service, entry) {
    updateServiceArray(service, 'Hosts', service.Hosts);
  };

  $scope.cancelChanges = function cancelChanges(service, keys) {
    if (keys) { // clean out the keys only from the list of modified keys
      keys.forEach(function(key) {
        var index = previousServiceValues.indexOf(key);
        if (index >= 0) {
          previousServiceValues.splice(index, 1);
        }
      });
    } else { // clean out all changes
      keys = Object.keys(service);
      previousServiceValues = [];
    }
    keys.forEach(function(attribute) {
      service[attribute] = originalService[attribute]; // reset service values
    });
    service.hasChanges = false;
  };

  $scope.hasChanges = function(service, elements) {
    var hasChanges = false;
    elements.forEach(function(key) {
      hasChanges = hasChanges || (previousServiceValues.indexOf(key) >= 0);
    });
    return hasChanges;
  };

  $scope.updateService = function updateService(service) {
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Name = service.Name;
    config.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceLabels);
    config.TaskTemplate.ContainerSpec.Env = ServiceHelper.translateEnvironmentVariablesToEnv(service.EnvironmentVariables);
    config.TaskTemplate.ContainerSpec.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceContainerLabels);
    config.TaskTemplate.ContainerSpec.Image = service.Image;
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

    // Round memory values to 0.125 and convert MB to B
    var memoryLimit = (Math.round(service.LimitMemoryBytes * 8) / 8).toFixed(3);
    memoryLimit *= 1024 * 1024;
    var memoryReservation = (Math.round(service.ReservationMemoryBytes * 8) / 8).toFixed(3);
    memoryReservation *= 1024 * 1024;
    config.TaskTemplate.Resources = {
      Limits: {
        NanoCPUs: service.LimitNanoCPUs * 1000000000,
        MemoryBytes: memoryLimit
      },
      Reservations: {
        NanoCPUs: service.ReservationNanoCPUs * 1000000000,
        MemoryBytes: memoryReservation
      }
    };

    config.UpdateConfig = {
      Parallelism: service.UpdateParallelism,
      Delay: ServiceHelper.translateHumanDurationToNanos(service.UpdateDelay) || 0,
      FailureAction: service.UpdateFailureAction,
      Order: service.UpdateOrder
    };

    if ($scope.hasChanges(service, ['RestartCondition', 'RestartDelay', 'RestartMaxAttempts', 'RestartWindow'])){
      config.TaskTemplate.RestartPolicy = {
        Condition: service.RestartCondition,
        Delay: ServiceHelper.translateHumanDurationToNanos(service.RestartDelay) || 5000000000,
        MaxAttempts: service.RestartMaxAttempts,
        Window: ServiceHelper.translateHumanDurationToNanos(service.RestartWindow) || 0
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
      Ports: service.Ports
    };

    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      if (data.message && data.message.match(/^rpc error:/)) {
        Notifications.error(data.message, 'Error');
      } else {
        Notifications.success('Service successfully updated', 'Service updated');
      }
      $scope.cancelChanges({});
      initView();
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to update service');
    });
  };

  $scope.removeService = function() {
    ModalService.confirmDeletion(
      'Do you want to remove this service? All the containers associated to this service will be removed too.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeService();
      }
    );
  };

  function removeService() {
    $scope.state.deletionInProgress = true;
    ServiceService.remove($scope.service)
    .then(function success(data) {
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

  $scope.forceUpdateService = function(service) {
    ModalService.confirmServiceForceUpdate(
      'Do you want to force update this service? All the tasks associated to the selected service(s) will be recreated.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        forceUpdateService(service);
      }
    );
  };

  function forceUpdateService(service) {
    var config = ServiceHelper.serviceToConfig(service.Model);
    // As explained in https://github.com/docker/swarmkit/issues/2364 ForceUpdate can accept a random
    // value or an increment of the counter value to force an update.
    config.TaskTemplate.ForceUpdate++;
    $scope.state.updateInProgress = true;
    ServiceService.update(service, config)
    .then(function success(data) {
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
  }

  function initView() {
    var apiVersion = $scope.applicationState.endpoint.apiVersion;

    ServiceService.service($transition$.params().id)
    .then(function success(data) {
      var service = data;
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
        tasks: TaskService.tasks({ service: [service.Name] }),
        nodes: NodeService.nodes(),
        secrets: apiVersion >= 1.25 ? SecretService.secrets() : [],
        configs: apiVersion >= 1.30 ? ConfigService.configs() : [],
        availableImages: ImageService.images(),
        availableLoggingDrivers: PluginService.loggingPlugins(apiVersion < 1.25)
      });
    })
    .then(function success(data) {
      $scope.tasks = data.tasks;
      $scope.nodes = data.nodes;
      $scope.configs = data.configs;
      $scope.secrets = data.secrets;
      $scope.availableImages = ImageService.getUniqueTagListFromImages(data.availableImages);
      $scope.availableLoggingDrivers = data.availableLoggingDrivers;

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
      $scope.state.addSecret = {override: false};

      $timeout(function() {
        $anchorScroll();
      });
    })
    .catch(function error(err) {
      $scope.secrets = [];
      $scope.configs = [];
      Notifications.error('Failure', err, 'Unable to retrieve service details');
    });
  }

  $scope.updateServiceAttribute = function updateServiceAttribute(service, name) {
    if (service[name] !== originalService[name] || !(name in originalService)) {
      service.hasChanges = true;
    }
    previousServiceValues.push(name);
  };

  function updateServiceArray(service, name) {
    previousServiceValues.push(name);
    service.hasChanges = true;
  }

  initView();
}]);
