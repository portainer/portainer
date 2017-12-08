angular.module('registryBrowse', [])
.controller('RegistryBrowseController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};
  $scope.repositories = [];

  function initView() {
    var registryID = $transition$.params().id;

    RegistryService.catalog(registryID)
    .then(function success(data) {
      //$scope.repositories = data.repositories;
      /*$scope.repositories = data.repositories.map(function (elem) {
        return {"Name": elem};
      });*/
      var tagsPromises = data.repositories.map(function (repository) {
        return RegistryService.tags(registryID, repository);
      });

      $q.all(tagsPromises)
      .then(function(allTags) {
        $scope.repositories = allTags;
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
