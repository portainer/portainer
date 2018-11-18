angular.module('portainer.extensions.registrymanagement')
.controller('ConfigureRegistryController', ['$scope', '$state', '$transition$', 'RegistryService', 'RegistryAPIService', 'Notifications',
function ($scope, $state, $transition$, RegistryService, RegistryAPIService, Notifications) {

  $scope.state = {
    testInProgress: false,
    updateInProgress: false
  };

  $scope.testConfiguration = testConfiguration;
  $scope.updateConfiguration = updateConfiguration;

  function testConfiguration() {
    $scope.state.testInProgress = true;

    RegistryService.configureRegistry($scope.registry.Id, $scope.model)
    .then(function success() {
      return RegistryAPIService.repositories($scope.registry.Id);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to test registry configuration');
    })
    .finally(function final() {
      $scope.state.testInProgress = false;
    });
  }

  function updateConfiguration() {
    // TODO: implement
  }

  function initView() {
    var registryId = $transition$.params().id;

    RegistryService.registry(registryId)
    .then(function success(data) {
      var registry = data;
      var model = new RegistryManagementConfigurationDefaultModel(registry);

      $scope.registry = registry;
      $scope.model = model;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
