angular.module('portainer.agent').factory('AgentService', [
  '$q', 'Agent', 'AgentVersion1', 'HttpRequestHelper', 'Host', 'HostVersion1', 'StateManager',
  function AgentServiceFactory($q, Agent, AgentVersion1, HttpRequestHelper, Host, HostVersion1, StateManager) {
    'use strict';
    var service = {};

    service.agents = agents;
    service.hostInfo = hostInfo;

    function getAgentApiVersion() {
      var state = StateManager.getState();
      return state.endpoint.agentVersion;
    }

    function hostInfo(nodeName) {
      var agentVersion = getAgentApiVersion();
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      return Host.info({version: agentVersion}).$promise;
    }

    function agents() {
      var agentVersion = getAgentApiVersion();

      var deferred = $q.defer();
      var service = agentVersion > 1 ? Agent : AgentVersion1;
      
      service.query({version: agentVersion})
        .$promise.then(function success(data) {
          var agents = data.map(function(item) {
            return new AgentViewModel(item);
          });
          deferred.resolve(agents);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve agents', err: err });
        });

      return deferred.promise;
    }

    return service;
  }
]);
