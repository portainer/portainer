angular.module('portainer.kubernetes')
  .factory('KubernetesNamespaceService', ['KubernetesNamespaces',
    function EndpointServiceFactory(KubernetesNamespaces) {
      'use strict';
      var service = {};

      service.namespaces = function() {
        return KubernetesNamespaces.query({}).$promise;
      };

      return service;
    }]);
