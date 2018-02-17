angular.module('portainer.app')
.controller('RegistryBrowseController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};

  function initView() {
    var registryID = $transition$.params().id;

    RegistryService.catalog(registryID)
    .then(function success(catalog) {
      $scope.repositories = catalog.Repositories.map(function (elem) {
        return {'Name': elem};
      });
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
