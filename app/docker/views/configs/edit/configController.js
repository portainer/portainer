angular.module('portainer.docker')
.controller('ConfigController', ['$scope', '$transition$', '$state', 'ConfigService', 'Notifications',
function ($scope, $transition$, $state, ConfigService, Notifications) {

  $scope.removeConfig = function removeConfig(configId) {
    ConfigService.remove(configId)
    .then(function success(data) {
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
}]);
