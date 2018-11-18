angular.module('portainer.extensions.registrymanagement')
.controller('RegistryRepositoriesController', ['$transition$', '$scope',  'RegistryService', 'RegistryAPIService', 'Notifications',
function ($transition$, $scope, RegistryService, RegistryAPIService, Notifications) {

  $scope.state = {
    displayInvalidConfigurationMessage: false
  };

  function initView() {
    var registryId = $transition$.params().id;

    RegistryService.registry(registryId)
    .then(function success(data) {
      $scope.registry = data;

      RegistryAPIService.repositories(registryId)
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
