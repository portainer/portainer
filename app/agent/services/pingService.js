import angular from 'angular';

angular.module('portainer.agent').service('AgentPingService', [
  'AgentPing',
  function AgentPingService(AgentPing) {
    var service = {};

    service.ping = ping;

    function ping() {
      return AgentPing.ping().$promise;
    }

    return service;
  }
]);
