angular.module('taskLogs', [])
.controller('TaskLogsController', ['$scope', '$transition$', 'ServiceService', 'TaskService', 'LogsService', 'Notifications',
function ($scope, $transition$, ServiceService, TaskService, LogsService, Notifications) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';

  var fetchLogsInterval;
  
  function getLogs() {
    $('#loadingViewSpinner').show();
    getLogsStdout();
    getLogsStderr();
    $('#loadingViewSpinner').hide();
  }

  function getLogsStderr() {
    LogsService.taskLogsStdErr($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsErr
     }).then(function(data) {
      $scope.stderr = data;
    });
  }

  function getLogsStdout() {
    LogsService.taskLogsStdOut($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsOut
    }).then(function(data) {
      $scope.stdout = data;
    });
  }

  function initView() {
    TaskService.task($transition$.params().id).then(function(task) {
        $scope.task = task;
        return ServiceService.service(task.ServiceId).then(function(service) {
            $scope.service = service;
            getLogs();
        });
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve task info');
    });

    fetchLogsInterval = $interval(getLogs, 5000);

    $scope.$on('$destroy', function () {
      $interval.cancel(fetchLogsInterval);
    });

    $scope.toggleTimestampsOut = getLogsStdout;
    $scope.toggleTimestampsErr = getLogsStderr;
  }

  initView();

}]);
