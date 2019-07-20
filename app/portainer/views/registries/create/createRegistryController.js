import { RegistryDefaultModel } from '../../../models/registry';

angular.module('portainer.app')
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications',
function ($scope, $state, RegistryService, Notifications) {

  $scope.selectQuayRegistry = selectQuayRegistry;
  $scope.selectAzureRegistry = selectAzureRegistry;
  $scope.selectCustomRegistry = selectCustomRegistry;
  $scope.create = createRegistry;

  $scope.state = {
    actionInProgress: false
  };

  function selectQuayRegistry() {
    $scope.model.Name = 'Quay';
    $scope.model.URL = 'quay.io';
    $scope.model.Authentication = true;
  }

  function selectAzureRegistry() {
    $scope.model.Name = '';
    $scope.model.URL = '';
    $scope.model.Authentication = true;
  }

  function selectCustomRegistry() {
    $scope.model.Name = '';
    $scope.model.URL = '';
    $scope.model.Authentication = false;
  }

  function createRegistry() {
    $scope.model.URL = $scope.model.URL.replace(/^https?\:\/\//i, '');

    $scope.state.actionInProgress = true;
    RegistryService.createRegistry($scope.model)
    .then(function success() {
      Notifications.success('Registry successfully created');
      $state.go('portainer.registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create registry');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }

  function initView() {
    $scope.model = new RegistryDefaultModel();
  }

  initView();
}]);
