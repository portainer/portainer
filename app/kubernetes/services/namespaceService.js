import _ from 'lodash-es';
import KubernetesNamespaceViewModel from '../models/namespace';

angular.module('portainer.kubernetes')
  .factory('KubernetesNamespaceService', ['$async', 'KubernetesNamespaces',
    function KubernetesNamespaceServiceFactory($async, KubernetesNamespaces) {
      'use strict';
      var service = {};

      async function namespacesAsync() {
        try {
          const data = await KubernetesNamespaces.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesNamespaceViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve namespaces', err:err};
        }
      }

      service.namespaces = function() {
        return $async(namespacesAsync);
      };

      return service;
    }]);
