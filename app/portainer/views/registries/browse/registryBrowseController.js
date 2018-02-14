angular.module('portainer.app')
.controller('RegistryBrowseController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};
  $scope.repositories = [];

  function initView() {
    var registryID = $transition$.params().id;

    RegistryService.catalog(registryID)
    .then(function success(catalog) {
      if (catalog.NotComplete) {
        $scope.headerMessage = 'Information: You have more than ' + catalog.Size + ' repositories in this registry. Only first ' + catalog.Size + ' are shown here.';
      }
      $scope.repositories = catalog.Repositories;
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
