import _ from 'lodash-es';
import KubernetesServiceViewModel from '../models/service';

angular.module('portainer.kubernetes')
  .factory('KubernetesServiceService', ['$async', 'KubernetesServices',
    function KubernetesServiceServiceFactory($async, KubernetesServices) {
      'use strict';
      var service = {};

      async function servicesAsync() {
        try {
          const data = await KubernetesServices.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesServiceViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve services', err:err};
        }
      }

      service.services = function() {
        return $async(servicesAsync);
      };

      return service;
    }]);
