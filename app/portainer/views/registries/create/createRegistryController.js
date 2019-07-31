import { RegistryDefaultModel } from '../../../models/registry';

angular.module('portainer.app')
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications', 'GitlabService',
function ($scope, $state, RegistryService, Notifications, GitlabService) {

  $scope.selectQuayRegistry = selectQuayRegistry;
  $scope.selectAzureRegistry = selectAzureRegistry;
  $scope.selectCustomRegistry = selectCustomRegistry;
  $scope.selectGitlabRegistry = selectGitlabRegistry;
  $scope.create = createRegistry;
  $scope.retrieveGitlabRegistries = retrieveGitlabRegistries;
  $scope.createGitlabRegistries = createGitlabRegistries;

  $scope.state = {
    actionInProgress: false,
    gitlab: {}
  };

  function selectQuayRegistry() {
    $scope.model.Name = 'Quay';
    $scope.model.URL = 'quay.io';
    $scope.model.Authentication = true;
  }

  function selectGitlabRegistry() {
    $scope.model.Name = '';
    $scope.model.URL = '';
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

  function retrieveGitlabRegistries() {
    // proxy test login + retrieve user registries (https://docs.gitlab.com/ee/api/projects.html#list-user-projects)
    // filter result with "container_registry_enabled": true
    GitlabService.projects($scope.model.URL, $scope.model.token)
    .then((data) => {
      $scope.gitlabProjects = data;
    }).catch((err) => {
      Notifications.error('Failure', err, 'Unable to retrieve projects');
    });
  }

  function createGitlabRegistries() {
    // get selectedItems
    // build all new portainer registries -> build urls
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
