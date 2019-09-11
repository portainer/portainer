import _ from 'lodash-es';
import KubernetesServiceViewModel from '../models/service';

angular.module('portainer.kubernetes')
  .factory('KubernetesServiceService', ['$async', 'KubernetesServices', 'KubernetesDeployments', 'KubernetesServiceHelper',
    function KubernetesServiceServiceFactory($async, KubernetesServices, KubernetesDeployments, KubernetesServiceHelper) {
      'use strict';
      var service = {};

      async function servicesAsync() {
        try {
          const [services, deployments] = await Promise.all([
            KubernetesServices.query({}).$promise,
            KubernetesDeployments.query({}).$promise
          ]);
          KubernetesServiceHelper.associateServicesAndDeployments(services.items, deployments.items);
          return _.map(deployments.items, (item) => new KubernetesServiceViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve services', err:err};
        }
      }

      service.services = function() {
        return $async(servicesAsync);
      };

      return service;
    }]);
