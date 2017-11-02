angular.module('swarmVisualizer', [])
.controller('SwarmVisualizerController', ['$q', '$scope', '$document', 'NodeService', 'ServiceService', 'TaskService', 'Notifications',
function ($q, $scope, $document, NodeService, ServiceService, TaskService, Notifications) {

  $scope.state = {
    ShowInformationPanel: true,
    DisplayOnlyRunningTasks: true
  };

  function assignServiceName(services, tasks) {
    for (var i = 0; i < services.length; i++) {
      var service = services[i];

      for (var j = 0; j < tasks.length; j++) {
        var task = tasks[j];

        if (task.ServiceId === service.Id) {
          task.ServiceName = service.Name;
        }
      }
    }
  }

  function assignTasksToNode(nodes, tasks) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      node.Tasks = [];

      for (var j = 0; j < tasks.length; j++) {
        var task = tasks[j];

        if (task.NodeId === node.Id) {
          node.Tasks.push(task);
        }
      }
    }
  }

  function prepareVisualizerData(nodes, services, tasks) {
    var visualizerData = {};

    var readyNodes = [];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.Status == "ready") {
            readyNodes.push(node);
        }
    }

    assignServiceName(services, tasks);
    assignTasksToNode(readyNodes, tasks);

    visualizerData.nodes = readyNodes;
    $scope.visualizerData = visualizerData;
  }

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      nodes: NodeService.nodes(),
      services: ServiceService.services(),
      tasks: TaskService.tasks()
    })
    .then(function success(data) {
      var nodes = data.nodes;
      $scope.nodes = nodes;
      var services = data.services;
      $scope.services = services;
      var tasks = data.tasks;
      $scope.tasks = tasks;
      prepareVisualizerData(nodes, services, tasks);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to initialize cluster visualizer');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
