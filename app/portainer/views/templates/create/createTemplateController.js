import { TemplateDefaultModel } from "../../../models/template";

angular.module('portainer.app')
.controller('CreateTemplateController', ['$q', '$scope', '$state', 'TemplateService', 'TemplateHelper', 'NetworkService', 'Notifications',
function ($q, $scope, $state, TemplateService, TemplateHelper, NetworkService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.create = function() {
    var model = $scope.model;

    $scope.state.actionInProgress = true;
    TemplateService.create(model)
    .then(function success() {
      Notifications.success('Template successfully created', model.Title);
      $state.go('portainer.templates');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create template');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    $scope.model = new TemplateDefaultModel();
    var provider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;

    $q.all({
      templates: TemplateService.templates(),
      networks: NetworkService.networks(
        provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
        false,
        provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25
      )
    })
    .then(function success(data) {
      $scope.categories = TemplateHelper.getUniqueCategories(data.templates);
      $scope.networks = data.networks;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve template details');
    });
  }

  initView();
}]);
