angular.module('taskLogs', [])
.controller('TaskLogsController', ['$scope', '$stateParams', 'ServiceService', 'TaskService', 'TaskLogs', 'Task', 'Notifications',
function ($scope, $stateParams, ServiceService, TaskService, TaskLogs, Task, Notifications) {
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
    TaskLogs.get($stateParams.id, {
      stdout: 0,
      stderr: 1,
      timestamps: $scope.state.displayTimestampsErr,
      tail: $scope.tailLines
    }, function (data, status, headers, config) {
        $scope.stderr = parseLogResults(data);
    });
  }

  function getLogsStdout() {
    TaskLogs.get($stateParams.id, {
      stdout: 1,
      stderr: 0,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
    }, function (data, status, headers, config) {
      $scope.stdout = parseLogResults(data);
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    TaskService.task($stateParams.id).then(function(task) {
        $scope.task = task;
        return ServiceService.service(task.ServiceId).then(function(service) {
            $scope.service = service;
            getLogs();
        });
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve task info');
    }).finally(function() {
      $('#loadingViewSpinner').hide();
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
