import _ from 'lodash-es';
import { KubernetesPodViewModel } from '../models/pod';

angular.module('portainer.kubernetes')
  .factory('KubernetesPodService', ['$async', 'KubernetesPods',
    function KubernetesPodServiceFactory($async, KubernetesPods) {
      'use strict';
      var factory = {
        pods: pods,
        // pod: pod
      };

      /**
       * Pods
       */
      async function podsAsync(namespace) {
        try {
          const data = await KubernetesPods(namespace).query().$promise;
          return _.map(data.items, (item) => new KubernetesPodViewModel(item));
        } catch (err) {
          throw { msg: 'Unable to retrieve pods', err: err };
        }
      }

      function pods(namespace) {
        return $async(podsAsync, namespace);
      }

      /**
       * Pod
       */
      // async function podAsync(namespace, name) {
      //   try {
      //     const [details, yaml] = await Promise.all([
      //       KubernetesPods(namespace).pod({ id: name }).$promise,
      //       KubernetesPods(namespace).yamlPod({ id: name }).$promise
      //     ]);
      //     return new KubernetesPodDetailsViewModel(details, yaml.data);
      //   } catch (err) {
      //     throw { msg: 'Unable to retrieve pod details', err: err };
      //   }
      // }

      // function pod(namespace, name) {
      //   return $async(podAsync, namespace, name);
      // }

      return factory;
    }]);