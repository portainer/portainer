angular.module('portainer.app')
.controller('TemplateController', ['$q', '$scope', '$state', '$transition$', 'TemplateService', 'NetworkService', 'Notifications',
function ($q, $scope, $state, $transition$, TemplateService, NetworkService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.update = function() {
    var model = $scope.template;

    $scope.state.actionInProgress = true;
    TemplateService.update(model)
    .then(function success() {
      Notifications.success('Template successfully updated', model.Title);
      $state.go('portainer.templates');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update template');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    var provider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;

    var templateId = $transition$.params().id;
    $q.all({
      templates: TemplateService.templates(),
      template: TemplateService.template(templateId),
      networks: NetworkService.networks(
        provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
        false,
        provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25
      )
    })
    .then(function success(data) {
      var categories = [];
      for (var i = 0; i < data.templates.length; i++) {
        var template = data.templates[i];
        categories = categories.concat(template.Categories);
      }
      $scope.categories = _.uniq(categories);
      $scope.template = data.template;
      $scope.networks = data.networks;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve template details');
    });
  }

  initView();
}]);
