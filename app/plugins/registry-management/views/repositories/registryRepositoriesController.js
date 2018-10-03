angular.module('portainer.plugins.registrymanagement')
.controller('RegistryRepositoriesController', ['$transition$', '$scope',  'RegistryService', 'LocalRegistryService', 'Notifications',
function ($transition$, $scope, RegistryService, LocalRegistryService, Notifications) {

  $scope.state = {
    displayInvalidConfigurationMessage: false
  };

  function initView() {
    var registryId = $transition$.params().id;

    RegistryService.registry(registryId)
    .then(function success(data) {
      $scope.registry = data;

      LocalRegistryService.repositories(registryId)
      .then(function success(data) {
        $scope.repositories = data;
      })
      .catch(function error() {
        $scope.state.displayInvalidConfigurationMessage = true;
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
