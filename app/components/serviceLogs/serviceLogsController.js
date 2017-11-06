angular.module('serviceLogs', [])
.controller('ServiceLogsController', ['$scope', '$transition$', '$anchorScroll', 'ServiceService',
function ($scope, $transition$, $anchorScroll, ServiceService) {
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

  function parseLogResults(data) {
    // Replace carriage returns with newlines to clean up output
    data = data.replace(/[\r]/g, '\n');
    // Strip 8 byte header from each line of output
    data = data.substring(8);
    data = data.replace(/\n(.{8})/g, '\n');
    return data;
  }

  function getLogsStderr() {
    ServiceService.logs({
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
    ServiceService.logs({
      id: $transition$.params().id,
      stdout: 1,
      stderr: 0,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
    }).then(function(data) {
      $scope.stdout = parseLogResults(data);
    });
  }

  function getService() {
    ServiceService.service($transition$.params().id).then(function(service) {
        $scope.service = service;
    }).catch(function(err) {
        Notifications.error('Failure', err, 'Unable to retrieve service info');
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
