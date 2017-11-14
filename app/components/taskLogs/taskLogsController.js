angular.module('taskLogs', [])
.controller('TaskLogsController', ['$scope', '$transition$', 'ServiceService', 'TaskService', 'Notifications',
function ($scope, $transition$, ServiceService, TaskService, Notifications) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';
  $scope.tailLines = 2000;

  function getLogs() {
    $('#loadingViewSpinner').show();
    getLogsStdout();
    getLogsStderr();
    $('#loadingViewSpinner').hide();
  }

  function parseLogResults(data) {
    // Replace carriage returns with newlines to clean up output
    data = data.replace(/[\r]/g, '\n');
    // Strip 8 byte header from each line of output
    data = data.substring(8);
    data = data.replace(/\n(.{8})/g, '\n');
    return data;
  }

  function getLogsStderr() {
    TaskService.logs({
      id: $transition$.params().id,
      stdout: 0,
      stderr: 1,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
     }).then(function(data) {
      $scope.stderr = parseLogResults(data);
    });
  }

  function getLogsStdout() {
    TaskService.logs({
      id: $transition$.params().id,
      stdout: 1,
      stderr: 0,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
    }).then(function(data) {
      $scope.stdout = parseLogResults(data);
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

    var logIntervalId = window.setInterval(getLogs, 5000);
    $scope.$on('$destroy', function() {
      // clearing interval when view changes
      clearInterval(logIntervalId);
    });

    $scope.toggleTimestampsOut = getLogsStdout;
    $scope.toggleTimestampsErr = getLogsStderr;
  }

  initView();

}]);
