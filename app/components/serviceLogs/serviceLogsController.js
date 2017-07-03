angular.module('serviceLogs', [])
.controller('ServiceLogsController', ['$scope', '$stateParams', '$anchorScroll', 'ServiceLogs', 'Service',
function ($scope, $stateParams, $anchorScroll, ServiceLogs, Service) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.stdout = '';
  $scope.stderr = '';
  $scope.tailLines = 2000;

  $('#loadingViewSpinner').show();
  Service.get({id: $stateParams.id}, function (d) {
    $scope.service = d;
    $('#loadingViewSpinner').hide();
  }, function (e) {
    $('#loadingViewSpinner').hide();
    Notifications.error("Failure", e, "Unable to retrieve service info");
  });

  function getLogs() {
    $('#loadingViewSpinner').show();
    getLogsStdout();
    getLogsStderr();
    $('#loadingViewSpinner').hide();
  }

  function getLogsStderr() {
    ServiceLogs.get($stateParams.id, {
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
      // Delete 156 Chars // com.docker.swarm.node.id=sov730ei4f0s26940rdmcgeql,com.docker.swarm.service.id=bobi0ougfe8fg6ewxvmft7ph2,com.docker.swarm.task.id=vx1oxavbdz0654dbp8a70dxmx
      //data = data.substring(122);
      //data = data.replace(/\n(.{122})/g, '\n');
      $scope.stderr = data;
    });
  }

  function getLogsStdout() {
    ServiceLogs.get($stateParams.id, {
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
      // Delete 156 Chars // com.docker.swarm.node.id=sov730ei4f0s26940rdmcgeql,com.docker.swarm.service.id=bobi0ougfe8fg6ewxvmft7ph2,com.docker.swarm.task.id=vx1oxavbdz0654dbp8a70dxmx
      //data = data.substring(122);
      //data = data.replace(/\n(.{122})/g, '\n');
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
