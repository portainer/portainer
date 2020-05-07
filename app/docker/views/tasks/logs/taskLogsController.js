import moment from 'moment';

angular.module('portainer.docker').controller('TaskLogsController', [
  '$scope',
  '$transition$',
  '$interval',
  'TaskService',
  'ServiceService',
  'Notifications',
  function ($scope, $transition$, $interval, TaskService, ServiceService, Notifications) {
    $scope.state = {
      refreshRate: 3,
      lineCount: 100,
      sinceTimestamp: '',
      displayTimestamps: false,
    };

    $scope.changeLogCollection = function (logCollectionStatus) {
      if (!logCollectionStatus) {
        stopRepeater();
      } else {
        setUpdateRepeater();
      }
    };

    $scope.$on('$destroy', function () {
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
      $scope.repeater = $interval(function () {
        TaskService.logs($transition$.params().id, 1, 1, $scope.state.displayTimestamps ? 1 : 0, moment($scope.state.sinceTimestamp).unix(), $scope.state.lineCount)
          .then(function success(data) {
            $scope.logs = data;
          })
          .catch(function error(err) {
            stopRepeater();
            Notifications.error('Failure', err, 'Unable to retrieve task logs');
          });
      }, refreshRate * 1000);
    }

    function startLogPolling() {
      TaskService.logs($transition$.params().id, 1, 1, $scope.state.displayTimestamps ? 1 : 0, moment($scope.state.sinceTimestamp).unix(), $scope.state.lineCount)
        .then(function success(data) {
          $scope.logs = data;
          setUpdateRepeater();
        })
        .catch(function error(err) {
          stopRepeater();
          Notifications.error('Failure', err, 'Unable to retrieve task logs');
        });
    }

    function initView() {
      TaskService.task($transition$.params().id)
        .then(function success(data) {
          var task = data;
          $scope.task = task;
          return ServiceService.service(task.ServiceId);
        })
        .then(function success(data) {
          var service = data;
          $scope.service = service;
          startLogPolling();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve task details');
        });
    }

    initView();
  },
]);
