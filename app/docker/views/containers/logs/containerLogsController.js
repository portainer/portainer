angular.module('portainer.docker')
.controller('ContainerLogsController', ['$scope', '$transition$', 'ContainerService', 'Notifications',
function ($scope, $transition$, ContainerService, Notifications) {
  $scope.state = {
    refreshRate: '3'
  };

  function goTerm() {
    var termWidth = 30;
    var termHeight = 30;

    term = new Terminal();
    term.open(document.getElementById('logs-xterm-container'), true);
    term.resize(termWidth, termHeight);
    term.fit();

    window.onresize = function() {
      term.fit();
    };

    term.write($scope.logs);
  }

  $scope.$on('$destroy', function() {
    stopRepeater();
  });

  function stopRepeater() {
    var repeater = $scope.repeater;
    if (angular.isDefined(repeater)) {
      $interval.cancel(repeater);
      repeater = null;
    }
  }

  function setUpdateRepeater(networkChart, cpuChart, memoryChart) {
    var refreshRate = $scope.state.refreshRate;
    $scope.repeater = $interval(function() {
      ContainerService.containerLogs($transition$.params().id, 1, 1, 0, 2000)
      .then(function success(data) {
        var logs = processLogs(data.message || '');
        $scope.logs = logs;
      })
      .catch(function error(err) {
        stopRepeater();
        Notifications.error('Failure', err, 'Unable to retrieve container statistics');
      });
    }, refreshRate * 1000);
  }

  function processLogs(data) {
    var logs = data;
    console.log(JSON.stringify(logs, null, 4));
    // Replace carriage returns with newlines to clean up output
    logs = logs.replace(/[\r]/g, '\n');
    // // Strip 8 byte header from each line of output
    logs = logs.substring(8);
    console.log(JSON.stringify(logs, null, 4));
    logs = logs.replace(/\n(.{8})/g, '\n\r');
    console.log(JSON.stringify(logs, null, 4));
    $scope.logs = logs;
  }

  function initView() {
    ContainerService.container($transition$.params().id)
    .then(function success(data) {
      $scope.container = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container information');
    });

    goTerm();
  }

  initView();
}]);
