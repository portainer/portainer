angular.module('portainer.agent').service('AgentPingService', [
  'Ping',
  function AgentPingService(Ping) {
    return {
      ping: ping
    };

    function ping() {
      return Ping.ping().$promise;
    }
  }
]);
