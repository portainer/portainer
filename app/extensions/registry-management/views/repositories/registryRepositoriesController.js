angular.module('portainer.extensions.registrymanagement')
.controller('RegistryRepositoriesController', ['$transition$', '$scope',  'RegistryService', 'RegistryV2Service', 'Notifications', 'Authentication',
function ($transition$, $scope, RegistryService, RegistryV2Service, Notifications, Authentication) {

  $scope.state = {
    displayInvalidConfigurationMessage: false
  };

  function initView() {
    var registryId = $transition$.params().id;

    var authenticationEnabled = $scope.applicationState.application.authentication;
    if (authenticationEnabled) {
      $scope.isAdmin = Authentication.isAdmin();
    }

    RegistryService.registry(registryId)
    .then(function success(data) {
      $scope.registry = data;

      RegistryV2Service.ping(registryId, false)
      .then(function success() {
        return RegistryV2Service.repositories(registryId);
      })
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
