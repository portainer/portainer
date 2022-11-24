angular.module('portainer.docker').controller('DashboardClusterAgentInfoController', [
  'AgentService',
  'Notifications',
  function (AgentService, Notifications) {
    var ctrl = this;

    this.$onInit = function () {
      AgentService.agents(ctrl.endpointId)
        .then(function success(data) {
          ctrl.agentCount = data.length;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve agent information');
        });
    };
  },
]);
