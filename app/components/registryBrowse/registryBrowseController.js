angular.module('registryBrowse', [])
.controller('RegistryBrowseController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};
  $scope.repositories = [];

  function initView() {
    var registryID = $transition$.params().id;

    RegistryService.catalog(registryID)
    .then(function success(data) {
      if (data.headers.link) {
        Notifications.warning('We only retrieve the first ' + data.data.repositories.length + ' repositories of the registry');
      }
      var tagsPromises = data.data.repositories.map(function (repository) {
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
