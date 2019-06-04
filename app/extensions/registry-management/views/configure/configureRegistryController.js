import { RegistryManagementConfigurationDefaultModel } from '../../../../portainer/models/registry';

angular.module('portainer.extensions.registrymanagement')
.controller('ConfigureRegistryController', ['$scope', '$state', '$transition$', 'RegistryService', 'RegistryV2Service', 'Notifications',
function ($scope, $state, $transition$, RegistryService, RegistryV2Service, Notifications) {

  $scope.state = {
    testInProgress: false,
    updateInProgress: false,
    validConfiguration : false
  };

  $scope.testConfiguration = testConfiguration;
  $scope.updateConfiguration = updateConfiguration;

  function testConfiguration() {
    $scope.state.testInProgress = true;

    RegistryService.configureRegistry($scope.registry.Id, $scope.model)
    .then(function success() {
      return RegistryV2Service.ping($scope.registry.Id, true);
    })
    .then(function success() {
      Notifications.success('Success', 'Valid management configuration');
      $scope.state.validConfiguration = true;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Invalid management configuration');
    })
    .finally(function final() {
      $scope.state.testInProgress = false;
    });
  }

  function updateConfiguration() {
    $scope.state.updateInProgress = true;

    RegistryService.configureRegistry($scope.registry.Id, $scope.model)
    .then(function success() {
      Notifications.success('Success', 'Registry management configuration updated');
      $state.go('portainer.registries.registry.repositories', { id: $scope.registry.Id }, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry management configuration');
    })
    .finally(function final() {
      $scope.state.updateInProgress = false;
    });
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
