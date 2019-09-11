import _ from 'lodash-es';
import KubernetesSecretViewModel from '../models/secret';

angular.module('portainer.kubernetes')
  .factory('KubernetesSecretService', ['$async', 'KubernetesSecrets',
    function KubernetesSecretServiceFactory($async, KubernetesSecrets) {
      'use strict';
      var service = {};

      async function secretsAsync() {
        try {
          const data = await KubernetesSecrets.query({}).$promise;
          return _.map(data.items, (item) => new KubernetesSecretViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve secrets', err:err};
        }
      }

      service.secrets = function() {
        return $async(secretsAsync);
      };

      return service;
    }]);
