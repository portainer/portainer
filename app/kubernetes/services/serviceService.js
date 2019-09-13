import _ from 'lodash-es';
import { KubernetesServiceViewModel, KubernetesServiceDetailsViewModel } from '../models/service';

angular.module('portainer.kubernetes')
  .factory('KubernetesServiceService', ['$async', 'KubernetesServices', 'KubernetesDeployments', 'KubernetesContainers', 'KubernetesServiceHelper',
    function KubernetesServiceServiceFactory($async, KubernetesServices, KubernetesDeployments, KubernetesContainers, KubernetesServiceHelper) {
      'use strict';
      var service = {};

      async function servicesAsync() {
        try {
          const [services, deployments] = await Promise.all([
            KubernetesServices.query({}).$promise,
            KubernetesDeployments().query({}).$promise
          ]);
          KubernetesServiceHelper.associateServicesAndDeployments(services.items, deployments.items);
          return _.map(deployments.items, (item) => new KubernetesServiceViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve services', err:err};
        }
      }

      async function serviceAsync(namespace, name) {
        try {
          const [details, yaml, containers] = await Promise.all([
            KubernetesDeployments(namespace).deployment({id: name}).$promise,
            KubernetesDeployments(namespace).yamlDeployment({id: name}).$promise,
            KubernetesContainers(namespace).query({}).$promise
          ]);
          KubernetesServiceHelper.associateContainersAndDeployment(containers.items, details);
          return new KubernetesServiceDetailsViewModel(details, yaml.data);
        } catch (err) {
          throw {msg: 'Unable to retrieve service details', err: err};
        }
      }

      service.services = function() {
        return $async(servicesAsync);
      };

      service.service = function(namespace, name) {
        return $async(serviceAsync, namespace, name);
      }

      return service;
    }]);
