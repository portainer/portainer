angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$transition$', '$anchorScroll', 'ContainerService',
function ($scope, $transition$, $anchorScroll, ContainerService) {
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
    ContainerService.logs({
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
    ContainerService.logs({
      id: $transition$.params().id,
      stdout: 1,
      stderr: 0,
      timestamps: $scope.state.displayTimestampsOut,
      tail: $scope.tailLines
    }).then(function(data) {
      $scope.stdout = parseLogResults(data);
    });
  }

  function getContainer() {
    $('#loadingViewSpinner').show();
    ContainerService.container($transition$.params().id).then(function(container) {
      $scope.container = container;
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container info');
    }).finally(function() {
      $('#loadingViewSpinner').hide();
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
