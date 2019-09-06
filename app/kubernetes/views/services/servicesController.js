import angular from 'angular';

class KubernetesServicesController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesServiceService, KubernetesDeploymentService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesServiceService = KubernetesServiceService;
    this.KubernetesDeploymentService = KubernetesDeploymentService;

    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    try {
      const [services, deployments] = await Promise.all([
        this.KubernetesServiceService.services(),
        this.KubernetesDeploymentService.deployments()
      ]);
      console.log(services);
      console.log(deployments)
      this.services = services;
      this.deployments = deployments;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve services and deployments');
    }
  }

  getAll() {
    return this.$async(this.getAllAsync);
  }

  async $onInit() {
    this.getAll();
  }
}

export default KubernetesServicesController;
angular.module('portainer.kubernetes').controller('KubernetesServicesController', KubernetesServicesController);

// angular.module('portainer.docker')
// .controller('ServicesController', ['$q', '$scope', 'ServiceService', 'ServiceHelper', 'Notifications', 'TaskService', 'TaskHelper', 'NodeService', 'ContainerService',
// function ($q, $scope, ServiceService, ServiceHelper, Notifications, TaskService, TaskHelper, NodeService, ContainerService) {

//   $scope.getServices = getServices;
//   function getServices() {
//     var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

//     $q.all({
//       services: ServiceService.services(),
//       tasks: TaskService.tasks(),
//       containers: agentProxy ? ContainerService.containers(1) : [],
//       nodes: NodeService.nodes()
//     })
//     .then(function success(data) {
//       var services = data.services;
//       var tasks = data.tasks;

//       if (agentProxy) {
//         var containers = data.containers;
//         for (var j = 0; j < tasks.length; j++) {
//           var task = tasks[j];
//           TaskHelper.associateContainerToTask(task, containers);
//         }
//       }

//       for (var i = 0; i < services.length; i++) {
//         var service = services[i];
//         ServiceHelper.associateTasksToService(service, tasks);
//       }

//       $scope.nodes = data.nodes;
//       $scope.tasks = tasks;
//       $scope.services = services;
//     })
//     .catch(function error(err) {
//       $scope.services = [];
//       Notifications.error('Failure', err, 'Unable to retrieve services');
//     });
//   }

//   function initView() {
//     getServices();
//   }

//   initView();
// }]);
