angular.module('config', [])
.controller('ConfigController', ['$scope', '$stateParams', '$state', 'ConfigService', 'Notifications',
function ($scope, $stateParams, $state, ConfigService, Notifications) {

  $scope.removeConfig = function removeConfig(configId) {
    $('#loadingViewSpinner').show();
    ConfigService.remove(configId)
    .then(function success(data) {
      Notifications.success('Config successfully removed');
      $state.go('configs', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove config');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    ConfigService.config($stateParams.id)
    .then(function success(data) {
      $scope.config = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve config details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
