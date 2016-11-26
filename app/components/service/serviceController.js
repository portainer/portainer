angular.module('service', [])
.controller('ServiceController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Task', 'Node', 'Messages', 'Settings',
function ($scope, $stateParams, $state, Service, ServiceHelper, Task, Node, Messages, Settings) {

  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Status';
  $scope.sortReverse = false;
  $scope.pagination_count = Settings.pagination_count;

  var previousServiceValues = {};

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
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
    updateServiceAttribute(service, 'Replicas', service.newServiceReplicas || service.Replicas);
    service.EditReplicas = false;
  };

  $scope.addEnvironmentVariable = function addEnvironmentVariable(service) {
    service.EnvironmentVariables.push({ key: '', value: '', originalValue: '' });
    service.hasChanges = true;
  };
  $scope.removeEnvironmentVariable = function removeEnvironmentVariable(service, index) {
    var removedElement = service.EnvironmentVariables.splice(index, 1);
    service.hasChanges = service.hasChanges || removedElement !== null;
  };
  $scope.updateEnvironmentVariable = function updateEnvironmentVariable(service, variable) {
    service.hasChanges = service.hasChanges || variable.value !== variable.originalValue;
  };
  $scope.addLabel = function addLabel(service) {
    service.hasChanges = true;
    service.ServiceLabels.push({ key: '', value: '', originalValue: '' });
  };
  $scope.removeLabel = function removeLabel(service, index) {
    var removedElement = service.ServiceLabels.splice(index, 1);
    service.hasChanges = service.hasChanges || removedElement !== null;
  };
  $scope.updateLabel = function updateLabel(service, label) {
    service.hasChanges = service.hasChanges || label.value !== label.originalValue;
  };
  $scope.addContainerLabel = function addContainerLabel(service) {
    service.hasChanges = true;
    service.ServiceContainerLabels.push({ key: '', value: '', originalValue: '' });
  };
  $scope.removeContainerLabel = function removeContainerLabel(service, index) {
    var removedElement = service.ServiceContainerLabels.splice(index, 1);
    service.hasChanges = service.hasChanges || removedElement !== null;
  };

  $scope.cancelChanges = function changeServiceImage(service) {
    Object.keys(previousServiceValues).forEach(function(attribute) {
      service[attribute] = previousServiceValues[attribute]; // reset service values
      service['newService' + attribute] = previousServiceValues[attribute]; // reset edit fields
    });
    previousServiceValues = {}; // clear out all changes
    // clear out environment variable changes
    service.EnvironmentVariables = translateEnvironmentVariables(service.Env);
    service.ServiceLabels = translateLabelsToServiceLabels(service.Labels);
    service.ServiceContainerLabels = translateLabelsToServiceLabels(service.ContainerLabels);

    service.hasChanges = false;
  };

  $scope.updateService = function updateService(service) {
    $('#loadServicesSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Name = service.newServiceName;
    config.Labels = translateServiceLabelsToLabels(service.ServiceLabels);
    config.TaskTemplate.ContainerSpec.Env = translateEnvironmentVariablesToEnv(service.EnvironmentVariables);
    config.TaskTemplate.ContainerSpec.Labels = translateServiceLabelsToLabels(service.ServiceContainerLabels);
    config.TaskTemplate.ContainerSpec.Image = service.newServiceImage;
    if (service.Mode === 'replicated') {
      config.Mode.Replicated.Replicas = service.Replicas;
    }

    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully updated", "Service updated");
      $state.go('service', {id: service.Id}, {reload: true});
    }, function (e) {
      $('#loadServicesSpinner').hide();
      Messages.error("Failure", e, "Unable to update service");
    });
  };


  $scope.removeService = function removeService() {
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
  };

  function fetchServiceDetails() {
    $('#loadingViewSpinner').show();
    Service.get({id: $stateParams.id}, function (d) {
      var service = new ServiceViewModel(d);
      service.newServiceName = service.Name;
      service.newServiceImage = service.Image;
      service.newServiceReplicas = service.Replicas;
      service.EnvironmentVariables = translateEnvironmentVariables(service.Env);
      service.ServiceLabels = translateLabelsToServiceLabels(service.Labels);
      service.ServiceContainerLabels = translateLabelsToServiceLabels(service.ContainerLabels);

      $scope.service = service;
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

  function updateServiceAttribute(service, name, newValue) {
    // ensure we only capture the original previous value, in case we update the attribute multiple times
    if (!previousServiceValues[name]) {
      previousServiceValues[name] = service[name];
    }
    // update the attribute
    service[name] = newValue;
    service.hasChanges = true;
  }

  function translateEnvironmentVariables(env) {
    if (env) {
      var variables = [];
      env.forEach(function(variable) {
        var idx = variable.indexOf('=');
        var keyValue = [variable.slice(0,idx), variable.slice(idx+1)];
        var originalValue = (keyValue.length > 1) ? keyValue[1] : '';
        variables.push({ key: keyValue[0], value: originalValue, originalValue: originalValue, added: true});
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
        labels.push({ key: key, value: Labels[key], originalValue: Labels[key], added: true});
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

  fetchServiceDetails();
}]);
