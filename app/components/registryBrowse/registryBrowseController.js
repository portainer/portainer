angular.module('registryBrowse', [])
.controller('RegistryBrowseController', ['$scope', '$transition$', 'RegistryService', 'Notifications',
function ($scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};

  function initView() {
    var registryID = $transition$.params().id;

    RegistryService.catalog(registryID)
    .then(function success(data) {
      $scope.repositories = data.repositories;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry catalog');
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
