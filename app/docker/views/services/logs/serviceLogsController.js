angular.module('portainer.docker')
.controller('ServiceLogsController', ['$scope', '$transition$', '$interval', 'ServiceService', 'Notifications',
function ($scope, $transition$, $interval, ServiceService, Notifications) {
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

  function setUpdateRepeater() {
    var refreshRate = $scope.state.refreshRate;
    $scope.repeater = $interval(function() {
      ServiceService.logs($transition$.params().id, 1, 1, 0, $scope.state.lineCount)
      .then(function success(data) {
        $scope.logs = data;
      })
      .catch(function error(err) {
        stopRepeater();
        Notifications.error('Failure', err, 'Unable to retrieve service logs');
      });
    }, refreshRate * 1000);
  }

  function startLogPolling() {
    ServiceService.logs($transition$.params().id, 1, 1, 0, $scope.state.lineCount)
    .then(function success(data) {
      $scope.logs = data;
      console.log(JSON.stringify(data, null, 4));
      setUpdateRepeater();
    })
    .catch(function error(err) {
      stopRepeater();
      Notifications.error('Failure', err, 'Unable to retrieve service logs');
    });
  }

  function initView() {
    ServiceService.service($transition$.params().id)
    .then(function success(data) {
      $scope.service = data;
      startLogPolling();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve service information');
    });

  }

  initView();
}]);
