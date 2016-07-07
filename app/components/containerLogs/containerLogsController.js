angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$stateParams', '$anchorScroll', 'ContainerLogs', 'Container',
function ($scope, $stateParams, $anchorScroll, ContainerLogs, Container) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';
  $scope.tailLines = 2000;

  $('#loadingViewSpinner').show();
  Container.get({id: $stateParams.id}, function (d) {
    $scope.container = d;
    $('#loadingViewSpinner').hide();
  }, function (e) {
    if (e.status === 404) {
      Messages.error("Not found", "Container not found.");
    } else {
      Messages.error("Failure", e.data);
    }
    $('#loadingViewSpinner').hide();
  });

  function getLogs() {
    $('#loadingViewSpinner').show();
    getLogsStdout();
    getLogsStderr();
    $('#loadingViewSpinner').hide();
  }

  function getLogsStderr() {
    ContainerLogs.get($stateParams.id, {
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
    ContainerLogs.get($stateParams.id, {
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

  // initial call
  getLogs();
  var logIntervalId = window.setInterval(getLogs, 5000);

  $scope.$on("$destroy", function () {
    // clearing interval when view changes
    clearInterval(logIntervalId);
  });

  $scope.toggleTimestampsOut = function () {
    getLogsStdout();
  };

  $scope.toggleTimestampsErr = function () {
    getLogsStderr();
  };
}]);
