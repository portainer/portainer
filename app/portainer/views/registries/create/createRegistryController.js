import { RegistryDefaultModel } from '../../../models/registry';
import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

angular.module('portainer.app')
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications', 'RegistryGitlabService', 'ExtensionService',
function ($scope, $state, RegistryService, Notifications, RegistryGitlabService, ExtensionService) {

  $scope.selectQuayRegistry = selectQuayRegistry;
  $scope.selectAzureRegistry = selectAzureRegistry;
  $scope.selectCustomRegistry = selectCustomRegistry;
  $scope.selectGitlabRegistry = selectGitlabRegistry;
  $scope.create = createRegistry;
  $scope.useDefaultGitlabConfiguration = useDefaultGitlabConfiguration;
  $scope.retrieveGitlabRegistries = retrieveGitlabRegistries;
  $scope.createGitlabRegistries = createGitlabRegistries;

  $scope.state = {
    actionInProgress: false,
    overrideConfiguration: false,
    gitlab: {}
  };

  function selectQuayRegistry() {
    $scope.model.Name = 'Quay';
    $scope.model.URL = 'quay.io';
    $scope.model.Authentication = true;
  }

  function useDefaultGitlabConfiguration() {
    $scope.model.URL = 'https://registry.gitlab.com';
    $scope.model.Gitlab.InstanceURL = 'https://gitlab.com';
  }

  function selectGitlabRegistry() {
    $scope.model.Name = '';
    $scope.model.Authentication = true;
    $scope.model.Gitlab = {};
    useDefaultGitlabConfiguration();
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

  function retrieveGitlabRegistries() {
    $scope.state.actionInProgress = true;
    RegistryGitlabService.projects($scope.model.Gitlab.InstanceURL, $scope.model.Token)
    .then((data) => {
      $scope.gitlabProjects = data;
    }).catch((err) => {
      Notifications.error('Failure', err, 'Unable to retrieve projects');
    }).finally(() => {
      $scope.state.actionInProgress = false;
    });
  }

  function createGitlabRegistries() {
    $scope.state.actionInProgress = true;
    RegistryService.createGitlabRegistries($scope.model, $scope.state.gitlab.selectedItems)
    .then(() => {
      Notifications.success('Registries successfully created');
      $state.go('portainer.registries');
    }).catch((err) => {
      Notifications.error('Failure', err, 'Unable to create registries');
    }).finally(() => {
      $scope.state.actionInProgress = false;
    });
  }

  function createRegistry() {
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
    $scope.RegistryTypes = RegistryTypes;
    $scope.model = new RegistryDefaultModel();
    ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.REGISTRY_MANAGEMENT)
    .then((data) => $scope.registryExtensionEnabled = data);
  }

  initView();
}]);
