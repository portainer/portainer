angular.module('stack', [])
.controller('StackController', ['$q', '$scope', '$stateParams', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ServiceHelper', 'Notifications',
function ($q, $scope, $stateParams, StackService, NodeService, ServiceService, TaskService, ServiceHelper, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackId = $stateParams.id;

    StackService.stack(stackId)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      var serviceFilters = {
        label: ['com.docker.stack.namespace=' + stack.Name]
      };

      return $q.all({
        services: ServiceService.services(serviceFilters),
        tasks: TaskService.tasks(serviceFilters),
        nodes: NodeService.nodes()
      });
    })
    .then(function success(data) {
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
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
