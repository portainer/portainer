angular.module('registry', [])
.controller('RegistryController', ['$scope', '$state', '$uiRouterGlobals', '$filter', 'RegistryService', 'Notifications',
function ($scope, $state, $uiRouterGlobals, $filter, RegistryService, Notifications) {

  $scope.updateRegistry = function() {
    $('#updateRegistrySpinner').show();
    var registry = $scope.registry;
    RegistryService.updateRegistry(registry)
    .then(function success(data) {
      Notifications.success('Registry successfully updated');
      $state.go('registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry');
    })
    .finally(function final() {
      $('#updateRegistrySpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var registryID = $uiRouterGlobals.params.id;
    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
