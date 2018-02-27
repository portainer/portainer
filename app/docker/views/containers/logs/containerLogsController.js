angular.module('portainer.docker')
.controller('ContainerLogsController', ['$scope', '$transition$', '$interval', 'ContainerService', 'Notifications',
function ($scope, $transition$, $interval, ContainerService, Notifications) {
  $scope.state = {
    refreshRate: 3,
    lineCount: 2000
  };

  $scope.changeLogCollection = function(logCollectionStatus) {
    if (!logCollectionStatus) {
      stopRepeater();
    } else {
      setUpdateRepeater();
    }
  };

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

  function update(logs) {
    $scope.logs = logs;
  }

  function setUpdateRepeater() {
    var refreshRate = $scope.state.refreshRate;
    $scope.repeater = $interval(function() {
      ContainerService.logs($transition$.params().id, 1, 1, 0, $scope.state.lineCount)
      .then(function success(data) {
        $scope.logs = data;
      })
      .catch(function error(err) {
        stopRepeater();
        Notifications.error('Failure', err, 'Unable to retrieve container logs');
      });
    }, refreshRate * 1000);
  }

  function startLogPolling() {
    ContainerService.logs($transition$.params().id, 1, 1, 0, $scope.state.lineCount)
    .then(function success(data) {
      $scope.logs = data;
      setUpdateRepeater();
    })
    .catch(function error(err) {
      stopRepeater();
      Notifications.error('Failure', err, 'Unable to retrieve container logs');
    });
  }

  function initView() {
    ContainerService.container($transition$.params().id)
    .then(function success(data) {
      $scope.container = data;
      startLogPolling();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container information');
    });
  }

  initView();
}]);
