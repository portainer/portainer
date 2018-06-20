angular.module('portainer.agent')
.factory('AgentService', ['$q', 'Agent', function AgentServiceFactory($q, Agent) {
  'use strict';
  var service = {};

  service.agents = function() {
    var deferred = $q.defer();

    Agent.query({}).$promise
    .then(function success(data) {
      var agents = data.map(function (item) {
        return new AgentViewModel(item);
      });
      deferred.resolve(agents);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve agents', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
