angular.module('portainer.extensions.registrymanagement')
.controller('RegistryRepositoriesController', ['$transition$', '$scope',  'RegistryService', 'RegistryV2Service', 'Notifications', 'Authentication',
function ($transition$, $scope, RegistryService, RegistryV2Service, Notifications, Authentication) {

  $scope.state = {
    displayInvalidConfigurationMessage: false,
    loading: false
  };

  $scope.paginationAction = function (repositories) {
    $scope.state.loading = true;
    RegistryV2Service.getRepositoriesDetails($scope.state.registryId, repositories)
    .then(function success(data) {
      for (var i = 0; i < data.length; i++) {
        var idx = _.findIndex($scope.repositories, {'Name': data[i].Name});
        if (idx !== -1) {
          $scope.repositories[idx].TagsCount = data[i].TagsCount;
        }
      }
      $scope.state.loading = false;
    }).catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repositories details');
    });
  };

  function initView() {
    $scope.state.registryId = $transition$.params().id;

    var authenticationEnabled = $scope.applicationState.application.authentication;
    if (authenticationEnabled) {
      $scope.isAdmin = Authentication.isAdmin();
    }

    RegistryService.registry($scope.state.registryId)
    .then(function success(data) {
      $scope.registry = data;

      RegistryV2Service.ping($scope.state.registryId, false)
      .then(function success() {
        return RegistryV2Service.repositories($scope.state.registryId);
      })
      .then(function success(data) {
        $scope.repositories = data;
      })
      .catch(function error() {
        $scope.state.displayInvalidConfigurationMessage = true;
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
