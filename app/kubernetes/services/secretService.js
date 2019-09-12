import _ from 'lodash-es';
import { KubernetesSecretViewModel, KubernetesSecretDetailsViewModel } from '../models/secret';

angular.module('portainer.kubernetes')
  .factory('KubernetesSecretService', ['$async', 'KubernetesSecrets',
    function KubernetesSecretServiceFactory($async, KubernetesSecrets) {
      'use strict';
      var service = {};

      async function secretsAsync() {
        try {
          const data = await KubernetesSecrets().query({}).$promise;
          return _.map(data.items, (item) => new KubernetesSecretViewModel(item));
        } catch (err) {
          throw {msg: 'Unable to retrieve secrets', err:err};
        }
      }

      async function secretAsync(namespace, name) {
        try {
          const [details, yaml] = await Promise.all([
            KubernetesSecrets(namespace).secret({id: name}).$promise,
            KubernetesSecrets(namespace).yamlSecret({id: name}).$promise
          ]);
          return new KubernetesSecretDetailsViewModel(details, yaml.data);
        } catch (err) {
          throw {msg: 'Unable to retrieve secret details', err: err};
        }
      }

      service.secrets = function() {
        return $async(secretsAsync);
      };

      service.secret = function(namespace, name) {
        return $async(secretAsync, namespace, name);
      }

      return service;
    }]);
