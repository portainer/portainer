import _ from 'lodash-es';

import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

angular.module('portainer.extensions.registrymanagement')
.controller('RegistryRepositoriesController', ['$transition$', '$scope',  'RegistryService', 'RegistryServiceSelector', 'Notifications', 'Authentication',
function ($transition$, $scope, RegistryService, RegistryServiceSelector, Notifications, Authentication) {

  $scope.state = {
    displayInvalidConfigurationMessage: false,
    loading: false
  };

  $scope.paginationAction = function (repositories) {
    if ($scope.registry.Type === RegistryTypes.GITLAB) {
      return;
    }
    $scope.state.loading = true;
    RegistryServiceSelector.getRepositoriesDetails($scope.registry, repositories)
    .then(function success(data) {
      for (var i = 0; i < data.length; i++) {
        var idx = _.findIndex($scope.repositories, {'Name': data[i].Name});
        if (idx !== -1) {
          if (data[i].TagsCount === 0) {
            $scope.repositories.splice(idx, 1);
          } else {
            $scope.repositories[idx].TagsCount = data[i].TagsCount;
          }
        }
      }
      $scope.state.loading = false;
    }).catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repositories details');
    });
  };

  function initView() {
    const registryId = $transition$.params().id;

    var authenticationEnabled = $scope.applicationState.application.authentication;
    if (authenticationEnabled) {
      $scope.isAdmin = Authentication.isAdmin();
    }

    RegistryService.registry(registryId)
    .then(function success(data) {
      $scope.registry = data;
      RegistryServiceSelector.ping($scope.registry, false)
      .then(function success() {
        return RegistryServiceSelector.repositories($scope.registry);
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
