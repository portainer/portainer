import { ResourceControlType } from '@/portainer/access-control/types';

angular.module('portainer.docker').controller('ConfigController', [
  '$scope',
  '$transition$',
  '$state',
  'ConfigService',
  'Notifications',
  function ($scope, $transition$, $state, ConfigService, Notifications) {
    $scope.resourceType = ResourceControlType.Config;

    $scope.onUpdateResourceControlSuccess = function () {
      $state.reload();
    };

    $scope.removeConfig = function removeConfig(configId) {
      ConfigService.remove(configId)
        .then(function success() {
          Notifications.success('Config successfully removed');
          $state.go('docker.configs', {});
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove config');
        });
    };

    function initView() {
      ConfigService.config($transition$.params().id)
        .then(function success(data) {
          $scope.config = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve config details');
        });
    }

    initView();
  },
]);
