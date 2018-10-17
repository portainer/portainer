angular.module('portainer.agent').service('AgentPingService', [
  'AgentPing',
  function AgentPingService(AgentPing) {
    return {
      ping: ping
    };

    function ping() {
      return AgentPing.ping().$promise;
    }
  }
]);
