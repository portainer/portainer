angular.module('registry', [])
.controller('RegistryController', ['$scope', '$state', '$transition$', '$filter', 'RegistryService', 'Notifications',
function ($scope, $state, $transition$, $filter, RegistryService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.updateRegistry = function() {
    var registry = $scope.registry;
    $scope.state.actionInProgress = true;
    RegistryService.updateRegistry(registry)
    .then(function success(data) {
      Notifications.success('Registry successfully updated');
      $state.go('registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    var registryID = $transition$.params().id;
    RegistryService.catalog(registryID)
    .then(function success(data) {
      //$scope.registry = data;
      console.log(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
