angular.module('portainer.docker')
.controller('StackController', ['$q', '$scope', '$state', '$transition$', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ServiceHelper', 'Notifications', 'FormHelper', 'EndpointProvider',
function ($q, $scope, $state, $transition$, StackService, NodeService, ServiceService, TaskService, ServiceHelper, Notifications, FormHelper, EndpointProvider) {

  $scope.state = {
    actionInProgress: false,
    publicURL: EndpointProvider.endpointPublicURL()
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

  function initView() {
    var stackId = $transition$.params().id;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;

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
        nodes: NodeService.nodes()
      });
    })
    .then(function success(data) {
      $scope.stackFileContent = data.stackFile;

      $scope.nodes = data.nodes;

      var services = data.services;

      var tasks = data.tasks;
      $scope.tasks = tasks;

      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        ServiceHelper.associateTasksToService(service, tasks);
      }

      $scope.services = services;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    });
  }

  $scope.editorUpdate = function(cm) {
    $scope.stackFileContent = cm.getValue();
  };

  initView();
}]);
