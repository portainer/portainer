angular.module('portainer.app')
.controller('StackController', ['$q', '$scope', '$state', '$transition$', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ContainerService', 'ServiceHelper', 'TaskHelper', 'Notifications', 'FormHelper',
function ($q, $scope, $state, $transition$, StackService, NodeService, ServiceService, TaskService, ContainerService, ServiceHelper, TaskHelper, Notifications, FormHelper) {

  $scope.state = {
    actionInProgress: false,
    externalStack: false
  };

  $scope.formValues = {
    Prune: false
  };

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
      containers: agentProxy ? ContainerService.containers(1) : [],
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
