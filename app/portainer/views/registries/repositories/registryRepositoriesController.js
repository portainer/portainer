angular.module('portainer.app')
  .controller('RegistryRepositoriesController', ['$q', '$transition$', '$scope',  'RegistryService', 'LocalRegistryService', 'Notifications',
    function ($q, $transition$, $scope, RegistryService, LocalRegistryService, Notifications) {

      $scope.state = {
        actionInProgress: false
      };
      $scope.repositories = [];
      $scope.registry = {};

      function initView() {
        var registryId = $transition$.params().id;
        $q.all({
          registry: RegistryService.registry(registryId),
          repositories: LocalRegistryService.repositories(registryId)
        }).then(function success(data) {
          $scope.registry = data.registry;
          $scope.repositories = data.repositories;
        }).catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve registry details');
        });
      }
      initView();
    }
  ]);