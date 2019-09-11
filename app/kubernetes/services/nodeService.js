import _ from 'lodash-es';
import KubernetesNodeViewModel from '../models/node';

angular.module('portainer.kubernetes')
  .factory('KubernetesNodeService', ['$async', 'KubernetesNodes',
    function KubernetesNodeServiceFactory($async, KubernetesNodes) {
      'use strict';
      var service = {};

      async function nodesAsync() {
        try {
          const data = await KubernetesNodes.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesNodeViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve nodes', err:err};
        }
      }

      service.nodes = function() {
        return $async(nodesAsync);
      };

      return service;
    }]);
