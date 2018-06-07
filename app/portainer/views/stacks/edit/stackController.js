angular.module('portainer.app')
.controller('StackController', ['$q', '$scope', '$state', '$transition$', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ContainerService', 'ServiceHelper', 'TaskHelper', 'Notifications', 'FormHelper', 'EndpointProvider', 'ModalService', 'NetworkService', 'VolumeService',
function ($q, $scope, $state, $transition$, StackService, NodeService, ServiceService, TaskService, ContainerService, ServiceHelper, TaskHelper, Notifications, FormHelper, EndpointProvider, ModalService, NetworkService, VolumeService) {

  $scope.state = {
    actionInProgress: false,
    publicURL: EndpointProvider.endpointPublicURL(),
    externalStack: false
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

  function loadStack(id) {
    var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

    StackService.stack(id)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      return $q.all({
        stackFile: StackService.getStackFile(id),
        resources: stack.Type === 1 ? retrieveSwarmStackResources(stack.Name, agentProxy) : retrieveComposeStackResources(stack.Name)
      });
    })
    .then(function success(data) {
      $scope.stackFileContent = data.stackFile;
      if ($scope.stack.Type === 1) {
        assignSwarmStackResources(data.resources, agentProxy);
      } else {
        assignComposeStackResources(data.resources);
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    });
  }

  function retrieveSwarmStackResources(stackName, agentProxy) {
    var stackFilter = {
      label: ['com.docker.stack.namespace=' + stackName]
    };

    return $q.all({
      services: ServiceService.services(stackFilter),
      tasks: TaskService.tasks(stackFilter),
      containers: agentProxy ? ContainerService.containers() : [],
      nodes: NodeService.nodes()
    });
  }

  function assignSwarmStackResources(resources, agentProxy) {
    var services = resources.services;
    var tasks = resources.tasks;

    if (agentProxy) {
      var containers = resources.containers;
      for (var j = 0; j < tasks.length; j++) {
        var task = tasks[j];
        TaskHelper.associateContainerToTask(task, containers);
      }
    }

    for (var i = 0; i < services.length; i++) {
      var service = services[i];
      ServiceHelper.associateTasksToService(service, tasks);
    }

    $scope.nodes = resources.nodes;
    $scope.tasks = tasks;
    $scope.services = services;
  }

  function retrieveComposeStackResources(stackName) {
    var stackFilter = {
      label: ['com.docker.compose.project=' + stackName]
    };

    return $q.all({
      containers: ContainerService.containers(1, stackFilter)
    });
  }

  function assignComposeStackResources(resources) {
    $scope.containers = resources.containers;
  }

  function loadExternalStack(name) {
    var stackType = $transition$.params().type;
    if (!stackType || (stackType !== '1' && stackType !== '2')) {
      Notifications.error('Failure', err, 'Invalid type URL parameter.');
      return;
    }

    if (stackType === '1') {
      loadExternalSwarmStack(name);
    } else {
      loadExternalComposeStack(name);
    }
  }

  function loadExternalSwarmStack(name) {
    var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

    retrieveSwarmStackResources(name)
    .then(function success(data) {
      assignSwarmStackResources(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    });
  }

  function loadExternalComposeStack(name) {
    retrieveComposeStackResources(name)
    .then(function success(data) {
      assignComposeStackResources(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    });
  }

  function initView() {
    var stackName = $transition$.params().name;
    $scope.stackName = stackName;
    var external = $transition$.params().external;

    if (external === 'true') {
      $scope.state.externalStack = true;
      loadExternalStack(stackName);
    } else {
      var stackId = $transition$.params().id;
      loadStack(stackId);
    }
  }

  initView();
}]);
