import { DockerHubViewModel } from '../../models/dockerhub';

angular.module('portainer.app').factory('DockerHubService', [
  '$q',
  'DockerHub',
  'Endpoints',
  'AgentDockerhub',
  function DockerHubServiceFactory($q, DockerHub, Endpoints, AgentDockerhub) {
    'use strict';
    var service = {};

    service.dockerhub = function () {
      var deferred = $q.defer();

      DockerHub.get()
        .$promise.then(function success(data) {
          var dockerhub = new DockerHubViewModel(data);
          deferred.resolve(dockerhub);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve DockerHub details', err: err });
        });

      return deferred.promise;
    };

    service.update = function (dockerhub) {
      return DockerHub.update({}, dockerhub).$promise;
    };

    service.checkRateLimits = checkRateLimits;
    function checkRateLimits(endpoint) {
      switch (endpoint.Type) {
        case 1: // DockerEnvironment
          if (endpoint.URL.includes('unix://') || endpoint.URL.includes('npipe://')) {
            return Endpoints.dockerhubLimits({ id: endpoint.Id }).$promise;
          }
          // query remote endpoint
          return;
        case 2: //AgentOnDockerEnvironment
        case 4: //EdgeAgentOnDockerEnvironment
          return AgentDockerhub.limits({ endpointId: endpoint.Id, endpointType: 'docker' }).$promise;
        case 5: //KubernetesLocalEnvironment
          return Endpoints.dockerhubLimits({ id: endpoint.Id }).$promise;
        case 6: //AgentOnKubernetesEnvironment
        case 7: //EdgeAgentOnKubernetesEnvironment
          return AgentDockerhub.limits({ endpointId: endpoint.Id, endpointType: 'kubernetes' }).$promise;
      }
    }

    return service;
  },
]);
