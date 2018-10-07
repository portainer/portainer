angular.module('portainer.plugins.registrymanagement')
.controller('ConfigureRegistryController', ['$scope', '$state', '$transition$', 'RegistryService', 'LocalRegistryService', 'Notifications',
function ($scope, $state, $transition$, RegistryService, LocalRegistryService, Notifications) {

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
      return LocalRegistryService.repositories($scope.registry.Id);
    })
    .then(function success(data) {
      console.log(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to test registry configuration');
    })
    .finally(function final() {
      $scope.state.testInProgress = false;
    });
  }

  function updateConfiguration() {

  }

  function initView() {
    var registryId = $transition$.params().id;
    var model = new RegistryManagementConfigurationModel();

    RegistryService.registry(registryId)
    .then(function success(data) {
      var registry = data;
      $scope.registry = data;
      if (registry.Authentication) {
        model.Authentication = true;
        model.Username = registry.Username;
      }
      $scope.model = model;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
