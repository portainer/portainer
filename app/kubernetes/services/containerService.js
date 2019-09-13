import _ from 'lodash-es';
import { KubernetesContainerViewModel, KubernetesContainerDetailsViewModel } from '../models/container';

angular.module('portainer.kubernetes')
  .factory('KubernetesContainerService', ['$async', 'KubernetesContainers',
    function KubernetesContainerServiceFactory($async, KubernetesContainers) {
      'use strict';
      var service = {};

      async function containersAsync() {
        try {
          const data = await KubernetesContainers().query({}).$promise;
          return _.map(data.items, (item) => new KubernetesContainerViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve containers', err:err};
        }
      }

      async function containerAsync(namespace, name) {
        try {
          const [details, yaml] = await Promise.all([
            KubernetesContainers(namespace).container({id: name}).$promise,
            KubernetesContainers(namespace).yamlContainer({id: name}).$promise
          ]);
          return new KubernetesContainerDetailsViewModel(details, yaml.data);
        } catch (err) {
          throw {msg: 'Unable to retrieve container details', err: err};
        }
      }

      service.containers = function() {
        return $async(containersAsync);
      };

      service.container = function(namespace, name) {
        return $async(containerAsync, namespace, name);
      };

      return service;
    }]);
