angular.module('service', [])
.controller('ServiceController', ['$scope', '$stateParams', '$state', '$location', '$anchorScroll', 'Service', 'ServiceHelper', 'Task', 'Node', 'Messages', 'Pagination', 'ModalService',
function ($scope, $stateParams, $state, $location, $anchorScroll, Service, ServiceHelper, Task, Node, Messages, Pagination, ModalService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('service_tasks');
  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

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
    $anchorScroll(hash);
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
  $scope.updatePlacementConstraint = function updatePlacementConstraint(service, constraint) {
    updateServiceArray(service, 'ServiceConstraints', service.ServiceConstraints);
  };

  $scope.addPublishedPort = function addPublishedPort(service) {
    if (!service.Ports) {
      service.Ports = [];
    }
    service.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp' });
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
    $('#loadServicesSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Name = service.Name;
    config.Labels = translateServiceLabelsToLabels(service.ServiceLabels);
    config.TaskTemplate.ContainerSpec.Env = translateEnvironmentVariablesToEnv(service.EnvironmentVariables);
    config.TaskTemplate.ContainerSpec.Labels = translateServiceLabelsToLabels(service.ServiceContainerLabels);
    config.TaskTemplate.ContainerSpec.Image = service.Image;
    config.TaskTemplate.ContainerSpec.Secrets = service.ServiceSecrets;

    if (service.Mode === 'replicated') {
      config.Mode.Replicated.Replicas = service.Replicas;
    }
    config.TaskTemplate.ContainerSpec.Mounts = service.ServiceMounts;
    if (typeof config.TaskTemplate.Placement === 'undefined') {
      config.TaskTemplate.Placement = {};
    }
    config.TaskTemplate.Placement.Constraints = translateKeyValueToConstraints(service.ServiceConstraints);

    config.TaskTemplate.Resources = {
      Limits: {
        NanoCPUs: service.LimitNanoCPUs,
        MemoryBytes: service.LimitMemoryBytes
      },
      Reservations: {
        NanoCPUs: service.ReservationNanoCPUs,
        MemoryBytes: service.ReservationMemoryBytes
      }
    };

    config.UpdateConfig = {
      Parallelism: service.UpdateParallelism,
      Delay: service.UpdateDelay,
      FailureAction: service.UpdateFailureAction
    };
    config.TaskTemplate.RestartPolicy = {
      Condition: service.RestartCondition,
      Delay: service.RestartDelay,
      MaxAttempts: service.RestartMaxAttempts,
      Window: service.RestartWindow
    };

    service.Ports.forEach(function (binding) {
      if (binding.PublishedPort === null || binding.PublishedPort === '') {
        delete binding.PublishedPort;
      }
    });

    config.EndpointSpec = {
      Mode: config.EndpointSpec.Mode || 'vip',
      Ports: service.Ports
    };

    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully updated", "Service updated");
      $scope.cancelChanges({});
      fetchServiceDetails();
    }, function (e) {
      $('#loadServicesSpinner').hide();
      Messages.error("Failure", e, "Unable to update service");
    });
  };

  $scope.removeService = function() {
    ModalService.confirmDeletion(
      'Do you want to delete this service? All the containers associated to this service will be removed too.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeService();
      }
    );
  };

  function removeService() {
    $('#loadingViewSpinner').show();
    Service.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Messages.send("Service removed", $stateParams.id);
        $state.go('services', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to remove service");
    });
  }

  function translateServiceArrays(service) {
    service.ServiceSecrets = service.Secrets;
    service.EnvironmentVariables = translateEnvironmentVariables(service.Env);
    service.ServiceLabels = translateLabelsToServiceLabels(service.Labels);
    service.ServiceContainerLabels = translateLabelsToServiceLabels(service.ContainerLabels);
    service.ServiceMounts = angular.copy(service.Mounts);
    service.ServiceConstraints = translateConstraintsToKeyValue(service.Constraints);
  }

  function fetchServiceDetails() {
    $('#loadingViewSpinner').show();
    Service.get({id: $stateParams.id}, function (d) {
      var service = new ServiceViewModel(d);
      $scope.isUpdating = $scope.lastVersion >= service.Version;
      if (!$scope.isUpdating) {
        $scope.lastVersion = service.Version;
      }

      translateServiceArrays(service);
      $scope.service = service;
      originalService = angular.copy(service);

      Task.query({filters: {service: [service.Name]}}, function (tasks) {
        Node.query({}, function (nodes) {
          $scope.displayNode = true;
          $scope.tasks = tasks.map(function (task) {
            return new TaskViewModel(task, nodes);
          });
          $('#loadingViewSpinner').hide();
        }, function (e) {
          $('#loadingViewSpinner').hide();
          $scope.tasks = tasks.map(function (task) {
            return new TaskViewModel(task, null);
          });
          Messages.error("Failure", e, "Unable to retrieve node information");
        });
      }, function (e) {
        $('#loadingViewSpinner').hide();
        Messages.error("Failure", e, "Unable to retrieve tasks associated to the service");
      });
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve service details");
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

  function translateEnvironmentVariables(env) {
    if (env) {
      var variables = [];
      env.forEach(function(variable) {
        var idx = variable.indexOf('=');
        var keyValue = [variable.slice(0,idx), variable.slice(idx+1)];
        var originalValue = (keyValue.length > 1) ? keyValue[1] : '';
        variables.push({ key: keyValue[0], value: originalValue, originalKey: keyValue[0], originalValue: originalValue, added: true});
      });
      return variables;
    }
    return [];
  }
  function translateEnvironmentVariablesToEnv(env) {
    if (env) {
      var variables = [];
      env.forEach(function(variable) {
        if (variable.key && variable.key !== '' && variable.value && variable.value !== '') {
          variables.push(variable.key + '=' + variable.value);
        }
      });
      return variables;
    }
    return [];
  }

  function translateLabelsToServiceLabels(Labels) {
    var labels = [];
    if (Labels) {
      Object.keys(Labels).forEach(function(key) {
        labels.push({ key: key, value: Labels[key], originalKey: key, originalValue: Labels[key], added: true});
      });
    }
    return labels;
  }
  function translateServiceLabelsToLabels(labels) {
    var Labels = {};
    if (labels) {
      labels.forEach(function(label) {
        Labels[label.key] = label.value;
      });
    }
    return Labels;
  }

  function translateConstraintsToKeyValue(constraints) {
    function getOperator(constraint) {
      var indexEquals = constraint.indexOf('==');
      if (indexEquals >= 0) {
        return [indexEquals, '=='];
      }
      return [constraint.indexOf('!='), '!='];
    }
    if (constraints) {
      var keyValueConstraints = [];
      constraints.forEach(function(constraint) {
        var operatorIndices = getOperator(constraint);

        var key = constraint.slice(0, operatorIndices[0]);
        var operator = operatorIndices[1];
        var value = constraint.slice(operatorIndices[0] + 2);

        keyValueConstraints.push({
          key: key,
          value: value,
          operator: operator,
          originalKey: key,
          originalValue: value
        });
      });
      return keyValueConstraints;
    }
    return [];
  }

  function translateKeyValueToConstraints(keyValueConstraints) {
    if (keyValueConstraints) {
      var constraints = [];
      keyValueConstraints.forEach(function(keyValueConstraint) {
        if (keyValueConstraint.key && keyValueConstraint.key !== '' && keyValueConstraint.value && keyValueConstraint.value !== '') {
          constraints.push(keyValueConstraint.key + keyValueConstraint.operator + keyValueConstraint.value);
        }
      });
      return constraints;
    }
    return [];
  }

  fetchServiceDetails();
}]);
