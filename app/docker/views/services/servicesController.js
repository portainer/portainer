import _ from 'lodash-es';

angular.module('portainer.docker').controller('ServicesController', [
  '$q',
  '$scope',
  'ServiceService',
  'ServiceHelper',
  'Notifications',
  'TaskService',
  'TaskHelper',
  'NodeService',
  'ContainerService',
  function ($q, $scope, ServiceService, ServiceHelper, Notifications, TaskService, TaskHelper, NodeService, ContainerService) {
    $scope.getServices = getServices;
    function getServices() {
      var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

      return $q
        .all({
          services: ServiceService.services(),
          tasks: TaskService.tasks(),
          containers: agentProxy ? ContainerService.containers(1) : [],
          nodes: NodeService.nodes(),
        })
        .then(function success(data) {
          var services = data.services;
          var tasks = data.tasks;
          var containers = data.containers;

          if (agentProxy) {
            for (var j = 0; j < tasks.length; j++) {
              var task = tasks[j];
              TaskHelper.associateContainerToTask(task, containers);
            }
          }

          for (var i = 0; i < services.length; i++) {
            var service = services[i];
            ServiceHelper.associateTasksToService(service, tasks);
          }

          if (agentProxy) {
            _.forEach(services, (service) => {
              if (service.HealthCheck) {
                ServiceHelper.computeHealthcheckStatus(service);
              }
            });
          }

          $scope.nodes = data.nodes;
          $scope.tasks = tasks;
          $scope.services = services;
        })
        .catch(function error(err) {
          $scope.services = [];
          Notifications.error('Failure', err, 'Unable to retrieve services');
        });
    }

    function initView() {
      getServices();
    }

    initView();
  },
]);
