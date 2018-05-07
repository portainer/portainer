angular.module('portainer.agent')
.controller('NodeSelectorController', ['AgentService', 'Notifications', function (AgentService, Notifications) {
  var ctrl = this;

  this.$onInit = function() {
    AgentService.agents()
    .then(function success(data) {
      ctrl.agents = data;
      if (!ctrl.model) {
        ctrl.model = data[0].NodeName;
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load agents');
    });
  };

}]);
