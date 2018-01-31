angular.module('portainer.docker')
.controller('ServiceLogsController', ['$scope', '$transition$', '$anchorScroll', 'ServiceLogs', 'Service',
function ($scope, $transition$, $anchorScroll, ServiceLogs, Service) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';
  $scope.tailLines = 2000;

  function getLogs() {
    getLogsStdout();
    getLogsStderr();
  }

  function getLogsStderr() {
    ServiceLogs.get($transition$.params().id, {
      stdout: 0,
      stderr: 1,
      timestamps: $scope.state.displayTimestampsErr,
      tail: $scope.tailLines
    }, function (data, status, headers, config) {
      // Replace carriage returns with newlines to clean up output
      data = data.replace(/[\r]/g, '\n');
      // Strip 8 byte header from each line of output
      data = data.substring(8);
      data = data.replace(/\n(.{8})/g, '\n');
      $scope.stderr = data;
    });
  }

  function getLogsStdout() {
    ServiceLogs.get($transition$.params().id, {
      stdout: 1,
      stderr: 0,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
    }, function (data, status, headers, config) {
      // Replace carriage returns with newlines to clean up output
      data = data.replace(/[\r]/g, '\n');
      // Strip 8 byte header from each line of output
      data = data.substring(8);
      data = data.replace(/\n(.{8})/g, '\n');
      $scope.stdout = data;
    });
  }

  function getService() {
    Service.get({id: $transition$.params().id}, function (d) {
      $scope.service = d;
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve service info');
    });
  }

  function initView() {
    getService();
    getLogs();

    var logIntervalId = window.setInterval(getLogs, 5000);

    $scope.$on('$destroy', function () {
      // clearing interval when view changes
      clearInterval(logIntervalId);
    });

    $scope.toggleTimestampsOut = function () {
      getLogsStdout();
    };

    $scope.toggleTimestampsErr = function () {
      getLogsStderr();
    };
  }

  initView();

}]);
