import angular from 'angular';

angular.module('portainer.agent').service('AgentPingService', AgentPingService);

function AgentPingService(AgentPing) {
  return { ping };

  function ping() {
    return AgentPing.ping().$promise;
  }
}
