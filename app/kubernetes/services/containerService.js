import _ from 'lodash-es';
import KubernetesContainerViewModel from '../models/container';

angular.module('portainer.kubernetes')
  .factory('KubernetesContainerService', ['$async', 'KubernetesPods',
    function KubernetesContainerServiceFactory($async, KubernetesPods) {
      'use strict';
      var service = {};

      async function containersAsync() {
        try {
          const data = await KubernetesPods.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesContainerViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve containers', err:err};
        }
      }

      service.containers = function() {
        return $async(containersAsync);
      };

      return service;
    }]);
