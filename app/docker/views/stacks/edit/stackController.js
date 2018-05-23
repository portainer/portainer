angular.module('portainer.docker')
.controller('StackController', ['$q', '$scope', '$state', '$transition$', '$filter', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ContainerService', 'ServiceHelper', 'TaskHelper', 'Notifications', 'FormHelper', 'EndpointProvider',
function ($q, $scope, $state, $transition$, $filter, StackService, NodeService, ServiceService, TaskService, ContainerService, ServiceHelper, TaskHelper, Notifications, FormHelper, EndpointProvider) {

  $scope.state = {
    actionInProgress: false,
    publicURL: EndpointProvider.endpointPublicURL()
  };

  $scope.formValues = {
    Prune: false
  };

  $scope.startAction = function(selectedItems) {
    var successMessage = 'Container successfully started';
    var errorMessage = 'Unable to start container';
    executeActionOnContainerList(selectedItems, ContainerService.startContainer, successMessage, errorMessage);
  };

  $scope.stopAction = function(selectedItems) {
    var successMessage = 'Container successfully stopped';
    var errorMessage = 'Unable to stop container';
    executeActionOnContainerList(selectedItems, ContainerService.stopContainer, successMessage, errorMessage);
  };

  $scope.restartAction = function(selectedItems) {
    var successMessage = 'Container successfully restarted';
    var errorMessage = 'Unable to restart container';
    executeActionOnContainerList(selectedItems, ContainerService.restartContainer, successMessage, errorMessage);
  };

  $scope.killAction = function(selectedItems) {
    var successMessage = 'Container successfully killed';
    var errorMessage = 'Unable to kill container';
    executeActionOnContainerList(selectedItems, ContainerService.killContainer, successMessage, errorMessage);
  };

  $scope.pauseAction = function(selectedItems) {
    var successMessage = 'Container successfully paused';
    var errorMessage = 'Unable to pause container';
    executeActionOnContainerList(selectedItems, ContainerService.pauseContainer, successMessage, errorMessage);
  };

  $scope.resumeAction = function(selectedItems) {
    var successMessage = 'Container successfully resumed';
    var errorMessage = 'Unable to resume container';
    executeActionOnContainerList(selectedItems, ContainerService.resumeContainer, successMessage, errorMessage);
  };

  $scope.confirmRemoveAction = function(selectedItems) {
    var isOneContainerRunning = false;
    for (var i = 0; i < selectedItems.length; i++) {
      var container = selectedItems[i];
      if (container.State === 'running') {
        isOneContainerRunning = true;
        break;
      }
    }

    var title = 'You are about to remove one or more container.';
    if (isOneContainerRunning) {
      title = 'You are about to remove one or more running container.';
    }

    ModalService.confirmContainerDeletion(title, function (result) {
        if(!result) { return; }
        var cleanVolumes = false;
        if (result[0]) {
          cleanVolumes = true;
        }
        removeAction(selectedItems, cleanVolumes);
      }
    );
  };

  function executeActionOnContainerList(containers, action, successMessage, errorMessage) {
    var actionCount = containers.length;
    angular.forEach(containers, function (container) {
      // TODO: only diff with ContainersController
      // HttpRequestHelper.setPortainerAgentTargetHeader(container.NodeName);
      action(container.Id)
      .then(function success() {
        Notifications.success(successMessage, container.Names[0]);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, errorMessage);
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  function removeAction(containers, cleanVolumes) {
    var actionCount = containers.length;
    angular.forEach(containers, function (container) {
      HttpRequestHelper.setPortainerAgentTargetHeader(container.NodeName);
      ContainerService.remove(container, cleanVolumes)
      .then(function success() {
        Notifications.success('Container successfully removed', container.Names[0]);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove container');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  $scope.deployStack = function () {
    var stackFile = $scope.stackFileContent;
    var env = FormHelper.removeInvalidEnvVars($scope.stack.Env);
    var prune = $scope.formValues.Prune;

    $scope.state.actionInProgress = true;
    StackService.updateStack($scope.stack.Id, stackFile, env, prune)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create stack');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.addEnvironmentVariable = function() {
    $scope.stack.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.stack.Env.splice(index, 1);
  };

  $scope.editorUpdate = function(cm) {
    $scope.stackFileContent = cm.getValue();
  };

  $scope.scaleAction =  function scaleService(service) {
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    ServiceService.update(service, config)
    .then(function success(data) {
      Notifications.success('Service successfully scaled', 'New replica count: ' + service.Replicas);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to scale service');
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
    });
  };

  function loadSwarmStack(stackId) {
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

    StackService.stack(stackId)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      var serviceFilters = {
        label: ['com.docker.stack.namespace=' + stack.Name]
      };

      return $q.all({
        stackFile: StackService.getStackFile(stackId),
        services: ServiceService.services(serviceFilters),
        tasks: TaskService.tasks(serviceFilters),
        containers: agentProxy ? ContainerService.containers() : [],
        nodes: NodeService.nodes()
      });
    })
    .then(function success(data) {
      $scope.stackFileContent = data.stackFile;
      $scope.nodes = data.nodes;

      var services = data.services;
      var tasks = data.tasks;

      if (agentProxy) {
        var containers = data.containers;
        for (var j = 0; j < tasks.length; j++) {
          var task = tasks[j];
          TaskHelper.associateContainerToTask(task, containers);
        }
      }

      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        ServiceHelper.associateTasksToService(service, tasks);
      }

      $scope.tasks = tasks;
      $scope.services = services;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    });
  }

  function loadComposeStack(stackId) {
    StackService.stack(stackId)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      var containerFilters = {
        label: ['com.docker.compose.project=' + stack.Name]
      };

      return $q.all({
        stackFile: StackService.getStackFile(stackId),
        containers: ContainerService.containers(1, containerFilters)
      });
    })
    .then(function success(data) {
      $scope.stackFileContent = data.stackFile;
      var containers = data.containers;

      // TODO: might want to integrate that part into ContainerService.containers
      for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        container.Status = $filter('containerstatus')(container.Status);
      }
      $scope.containers = containers;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    });
  }

  function initView() {
    var stackId = $transition$.params().id;
    var endpointMode = $scope.applicationState.endpoint.mode;
    if (endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER') {
      loadSwarmStack(stackId);
    } else {
      loadComposeStack(stackId);
    }
  }

  initView();
}]);
