import _ from 'lodash-es';
import { KubernetesConfigViewModel, KubernetesConfigDetailsViewModel } from '../models/config';

angular.module('portainer.kubernetes')
  .factory('KubernetesConfigService', ['$async', 'KubernetesConfigs',
    function KubernetesConfigServiceFactory($async, KubernetesConfigs) {
      'use strict';
      var service = {};

      async function configsAsync() {
        try {
          const data = await KubernetesConfigs().query({}).$promise;
          return _.map(data.items, (item) => new KubernetesConfigViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve configs', err:err};
        }
      }

      async function configAsync(namespace, configName) {
        try {
          const details = await KubernetesConfigs(namespace).config({id: configName}).$promise;
          const yaml = await KubernetesConfigs(namespace).yamlConfig({id: configName}).$promise;
          return new KubernetesConfigDetailsViewModel(details, yaml.data);
        } catch (err) {
          throw {msg: 'Unable to retrieve config details', err: err};
        }
      }

      service.configs = function() {
        return $async(configsAsync);
      };

      service.config = function(namespace, configName) {
        return $async(configAsync, namespace, configName);
      }

      return service;
    }]);
