angular.module('registryBrowseTags', [])
.controller('RegistryBrowseTagsController', ['$scope', '$transition$', 'RegistryService', 'Notifications', 'Pagination',
function ($scope, $transition$, RegistryService, Notifications, Pagination) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('repositories');

  function initView() {
    var registryID = $transition$.params().id;
    var repository = $transition$.params().repository;
    $scope.repository = repository;

    RegistryService.tags(registryID, repository)
    .then(function success(data) {
      $scope.tags = data.tags;
      RegistryService.manifests(registryID, repository, data.tags[0])
      .then(function success(manif) {
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve repository tag manifests');
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repository tags');
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
