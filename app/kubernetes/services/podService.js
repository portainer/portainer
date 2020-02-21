import _ from 'lodash-es';
import {KubernetesPodViewModel} from '../models/pod';

angular.module('portainer.kubernetes')
  .factory('KubernetesPodService', ['$async', 'KubernetesPods',
    function KubernetesPodServiceFactory($async, KubernetesPods) {
      'use strict';
      var factory = {
        pods: pods,
        // pod: pod
        logs: logs
      };

      /**
       * Pods
       */
      async function podsAsync(namespace) {
        try {
          const data = await KubernetesPods(namespace).get().$promise;
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

      /**
       * Logs
       *
       * @param {string} namespace
       * @param {string} podName
       */
      async function logsAsync(namespace, podName) {
        const params = {
          id: podName,
        };
        try {
          const data = await KubernetesPods(namespace).logs(params).$promise;
          return data.logs.length === 0 ? [] : data.logs.split("\n");
        } catch (err) {
          throw { msg: 'Unable to retrieve pod logs', err: err };
        }
      }

      function logs(namespace, podName) {
        return $async(logsAsync, namespace, podName);
      }

      return factory;
    }]);