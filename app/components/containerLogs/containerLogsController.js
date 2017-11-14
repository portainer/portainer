angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$transition$', '$anchorScroll', 'ContainerService', 'LogsService', 'Notifications',
function ($scope, $transition$, $anchorScroll, ContainerService, LogsService, Notifications) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';

  function getLogs() {
    getLogsStdout();
    getLogsStderr();
  }

  function getLogsStderr() {
    LogsService.containerLogsStdErr($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsErr
     }).then(function(data) {
      $scope.stderr = data;
    });
  }

  function getLogsStdout() {
    LogsService.containerLogsStdOut($transition$.params().id, {
      timestamps: $scope.state.displayTimestampsOut
    }).then(function(data) {
      $scope.stdout = data;
    });
  }

  function getContainer() {
    ContainerService.container($transition$.params().id).then(function(container) {
      $scope.container = container;
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container info');
    });
  }

  function initView() {
    getContainer();
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
