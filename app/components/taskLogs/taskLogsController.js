angular.module('taskLogs', [])
.controller('TaskLogsController', ['$scope', '$transition$', 'ServiceService', 'TaskService', 'Notifications',
function ($scope, $transition$, ServiceService, TaskService, Notifications) {

  $scope.TaskId = $transition$.params().id;

  function initView() {
    TaskService.task($transition$.params().id).then(function(task) {
        $scope.task = task;
        return ServiceService.service(task.ServiceId).then(function(service) {
            $scope.service = service;
        });
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve task info');
    });

  }

  initView();

}]);
