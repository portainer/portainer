angular.module('portainer.docker')
.controller('SwarmVisualizerController', ['$q', '$scope', '$document', '$interval', 'NodeService', 'ServiceService', 'TaskService', 'Notifications',
function ($q, $scope, $document, $interval, NodeService, ServiceService, TaskService, Notifications) {

  $scope.state = {
    ShowInformationPanel: true,
    DisplayOnlyRunningTasks: false,
    refreshRate: '5'
  };

  $scope.$on('$destroy', function() {
    stopRepeater();
  });

  $scope.changeUpdateRepeater = function() {
    stopRepeater();
    setUpdateRepeater();
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(1500);
  };

  function stopRepeater() {
    var repeater = $scope.repeater;
    if (angular.isDefined(repeater)) {
      $interval.cancel(repeater);
      repeater = null;
    }
  }

  function setUpdateRepeater() {
    var refreshRate = $scope.state.refreshRate;
    $scope.repeater = $interval(function() {
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
        stopRepeater();
        Notifications.error('Failure', err, 'Unable to retrieve cluster information');
      });
    }, refreshRate * 1000);
  }


  function assignServiceInfo(services, tasks) {
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

    assignServiceInfo(services, tasks);
    assignTasksToNode(nodes, tasks);

    visualizerData.nodes = nodes;
    $scope.visualizerData = visualizerData;
  }

  function initView() {
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
      setUpdateRepeater();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to initialize cluster visualizer');
    });
  }

  initView();
}]);
