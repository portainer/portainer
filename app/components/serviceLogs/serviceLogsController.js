angular.module('serviceLogs', [])
.controller('ServiceLogsController', ['$scope', '$interval', '$transition$', '$anchorScroll', 'ServiceService', 'LogsService', 'Notifications',
function ($scope, $interval, $transition$, $anchorScroll, ServiceService, LogsService, Notifications) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';

  var fetchLogsInterval;

  function getLogs() {
    getLogsStdout();
    getLogsStderr();
  }

  function getLogsStderr() {
    LogsService.serviceLogsStdErr($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsErr
     }).then(function(data) {
      $scope.stderr = data;
    });
  }

  function getLogsStdout() {
    LogsService.serviceLogsStdOut($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsOut
    }).then(function(data) {
      $scope.stdout = data;
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

    fetchLogsInterval = $interval(getLogs, 5000);

    $scope.$on('$destroy', function () {
      $interval.cancel(fetchLogsInterval);
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
