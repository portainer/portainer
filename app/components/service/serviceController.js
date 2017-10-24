angular.module('service', [])
.controller('ServiceController', ['$q', '$scope', '$transition$', '$state', '$location', '$timeout', '$anchorScroll', 'ServiceService', 'SecretService', 'SecretHelper', 'Service', 'ServiceHelper', 'LabelHelper', 'TaskService', 'NodeService', 'Notifications', 'Pagination', 'ModalService',
function ($q, $scope, $transition$, $state, $location, $timeout, $anchorScroll, ServiceService, SecretService, SecretHelper, Service, ServiceHelper, LabelHelper, TaskService, NodeService, Notifications, Pagination, ModalService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('service_tasks');
  $scope.tasks = [];
  $scope.sortType = 'Updated';
  $scope.sortReverse = true;

  $scope.lastVersion = 0;

  var originalService = {};
  var previousServiceValues = [];

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('service_tasks', $scope.state.pagination_count);
  };

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
  $scope.addSecret = function addSecret(service, secret) {
    if (secret && service.ServiceSecrets.filter(function(serviceSecret) { return serviceSecret.Id === secret.Id;}).length === 0) {
      service.ServiceSecrets.push({ Id: secret.Id, Name: secret.Name, FileName: secret.Name, Uid: '0', Gid: '0', Mode: 444 });
      updateServiceArray(service, 'ServiceSecrets', service.ServiceSecrets);
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
    $('#loadingViewSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Name = service.Name;
    config.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceLabels);
    config.TaskTemplate.ContainerSpec.Env = ServiceHelper.translateEnvironmentVariablesToEnv(service.EnvironmentVariables);
    config.TaskTemplate.ContainerSpec.Labels = LabelHelper.fromKeyValueToLabelHash(service.ServiceContainerLabels);
    config.TaskTemplate.ContainerSpec.Image = service.Image;
    config.TaskTemplate.ContainerSpec.Healthcheck = service.Healthcheck;
    config.TaskTemplate.ContainerSpec.Secrets = service.ServiceSecrets ? service.ServiceSecrets.map(SecretHelper.secretConfig) : [];

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
      Delay: service.UpdateDelay,
      FailureAction: service.UpdateFailureAction,
      Order: service.UpdateOrder
    };

    config.TaskTemplate.RestartPolicy = {
      Condition: service.RestartCondition,
      Delay: service.RestartDelay,
      MaxAttempts: service.RestartMaxAttempts,
      Window: service.RestartWindow
    };

    if (service.Ports) {
      service.Ports.forEach(function (binding) {
        if (binding.PublishedPort === null || binding.PublishedPort === '') {
          delete binding.PublishedPort;
        }
      });
    }

    config.EndpointSpec = {
      Mode: config.EndpointSpec.Mode || 'vip',
      Ports: service.Ports
    };

    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadingViewSpinner').hide();
      if (data.message && data.message.match(/^rpc error:/)) {
        Notifications.error(data.message, 'Error');
      } else {
        Notifications.success('Service successfully updated', 'Service updated');
      }
      $scope.cancelChanges({});
      initView();
    }, function (e) {
      $('#loadingViewSpinner').hide();
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
    $('#loadingViewSpinner').show();
    ServiceService.remove($scope.service)
    .then(function success(data) {
      Notifications.success('Service successfully deleted');
      $state.go('services', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove service');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function translateServiceArrays(service) {
    service.ServiceSecrets = service.Secrets ? service.Secrets.map(SecretHelper.flattenSecret) : [];
    service.EnvironmentVariables = ServiceHelper.translateEnvironmentVariables(service.Env);
    service.ServiceLabels = LabelHelper.fromLabelHashToKeyValue(service.Labels);
    service.ServiceContainerLabels = LabelHelper.fromLabelHashToKeyValue(service.ContainerLabels);
    service.ServiceMounts = angular.copy(service.Mounts);
    service.ServiceConstraints = ServiceHelper.translateConstraintsToKeyValue(service.Constraints);
    service.ServicePreferences = ServiceHelper.translatePreferencesToKeyValue(service.Preferences);
  }

  function transformResources(service) {
    service.LimitNanoCPUs = service.LimitNanoCPUs / 1000000000 || 0;
    service.ReservationNanoCPUs = service.ReservationNanoCPUs / 1000000000 || 0;
    service.LimitMemoryBytes = service.LimitMemoryBytes / 1024 / 1024 || 0;
    service.ReservationMemoryBytes = service.ReservationMemoryBytes / 1024 / 1024 || 0;
  }

  function initView() {
    $('#loadingViewSpinner').show();
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
      $scope.service = service;
      originalService = angular.copy(service);

      return $q.all({
        tasks: TaskService.tasks({ service: [service.Name] }),
        nodes: NodeService.nodes(),
        secrets: apiVersion >= 1.25 ? SecretService.secrets() : []
      });
    })
    .then(function success(data) {
      $scope.tasks = data.tasks;
      $scope.nodes = data.nodes;
      $scope.secrets = data.secrets;

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

      $timeout(function() {
        $anchorScroll();
      });
    })
    .catch(function error(err) {
      $scope.secrets = [];
      Notifications.error('Failure', err, 'Unable to retrieve service details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
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
