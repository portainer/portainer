import moment from 'moment';

angular.module('portainer.docker').controller('ContainerLogsController', [
  '$scope',
  '$transition$',
  '$interval',
  'ContainerService',
  'Notifications',
  'HttpRequestHelper',
  'endpoint',
  function ($scope, $transition$, $interval, ContainerService, Notifications, HttpRequestHelper, endpoint) {
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
        setUpdateRepeater(!$scope.container.Config.Tty);
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

    function setUpdateRepeater(skipHeaders) {
      var refreshRate = $scope.state.refreshRate;
      $scope.repeater = $interval(function () {
        ContainerService.logs(
          endpoint.Id,
          $transition$.params().id,
          1,
          1,
          $scope.state.displayTimestamps ? 1 : 0,
          moment($scope.state.sinceTimestamp).unix(),
          $scope.state.lineCount,
          skipHeaders
        )
          .then(function success(data) {
            $scope.logs = data;
          })
          .catch(function error(err) {
            stopRepeater();
            Notifications.error('Failure', err, 'Unable to retrieve container logs');
          });
      }, refreshRate * 1000);
    }

    function startLogPolling(skipHeaders) {
      ContainerService.logs(
        endpoint.Id,
        $transition$.params().id,
        1,
        1,
        $scope.state.displayTimestamps ? 1 : 0,
        moment($scope.state.sinceTimestamp).unix(),
        $scope.state.lineCount,
        skipHeaders
      )
        .then(function success(data) {
          $scope.logs = data;
          setUpdateRepeater(skipHeaders);
        })
        .catch(function error(err) {
          stopRepeater();
          Notifications.error('Failure', err, 'Unable to retrieve container logs');
        });
    }

    function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      ContainerService.container(endpoint.Id, $transition$.params().id)
        .then(function success(data) {
          var container = data;
          $scope.container = container;

          const logsEnabled = container.HostConfig && container.HostConfig.LogConfig && container.HostConfig.LogConfig.Type && container.HostConfig.LogConfig.Type !== 'none';
          $scope.logsEnabled = logsEnabled;

          if (logsEnabled) {
            startLogPolling(!container.Config.Tty);
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container information');
        });
    }

    initView();
  },
]);
