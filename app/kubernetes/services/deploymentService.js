import _ from 'lodash-es';
import KubernetesDeploymentViewModel from '../models/deployment';

angular.module('portainer.kubernetes')
  .factory('KubernetesDeploymentService', ['$async', 'KubernetesDeployments',
    function KubernetesDeploymentServiceFactory($async, KubernetesDeployments) {
      'use strict';
      var service = {};

      async function deploymentsAsync() {
        try {
          const data = await KubernetesDeployments.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesDeploymentViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve deployments', err:err};
        }
      }

      service.deployments = function() {
        return $async(deploymentsAsync);
      };

      return service;
    }]);
