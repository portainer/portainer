import _ from 'lodash-es';
import KubernetesConfigViewModel from '../models/config';

angular.module('portainer.kubernetes')
  .factory('KubernetesConfigService', ['$async', 'KubernetesConfigs',
    function KubernetesConfigServiceFactory($async, KubernetesConfigs) {
      'use strict';
      var service = {};

      async function configsAsync() {
        try {
          const data = await KubernetesConfigs.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesConfigViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve configs', err:err};
        }
      }

      service.configs = function() {
        return $async(configsAsync);
      };

      return service;
    }]);
