import _ from 'lodash-es';
import {KubernetesNodeDetailsViewModel, KubernetesNodeViewModel} from '../models/node';

angular.module('portainer.kubernetes')
  .factory('KubernetesNodeService', ['$async', 'KubernetesNodes',
    function KubernetesNodeServiceFactory($async, KubernetesNodes) {
      'use strict';
      // TODO: review on architecture/refactor meeting
      // Ensure that all services are using the same structure for code consistency
      var service = {};

      async function nodesAsync() {
        try {
          const data = await KubernetesNodes.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesNodeViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve nodes', err:err};
        }
      }

      async function nodeAsync(name) {
        try {
          const [details, yaml] = await Promise.all([
            KubernetesNodes.node({id: name}).$promise,
            KubernetesNodes.yamlNode({id: name}).$promise
          ]);
          return new KubernetesNodeDetailsViewModel(details, yaml.data);
        } catch (err) {
          throw {msg: 'Unable to retrieve node details', err: err};
        }
      }

      service.nodes = function() {
        return $async(nodesAsync);
      };

      service.node = function(name) {
        return $async(nodeAsync, name);
      };

      return service;
    }]);
