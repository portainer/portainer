angular.module('portainer.agent').factory('AgentService', [
  '$q', 'Agent','HttpRequestHelper', 'Host', 'Ping',
  function AgentServiceFactory($q, Agent, HttpRequestHelper, Host, Ping) {
    'use strict';
    var service = {};

    service.agents = agents;
    service.hostInfo = hostInfo;
    service.ping = ping;

    function ping() {
      return Ping.ping().$promise;
    }

    function hostInfo(nodeName) {
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      return Host.info().$promise;
    }

    function agents() {
      var deferred = $q.defer();

      Agent.query({})
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
