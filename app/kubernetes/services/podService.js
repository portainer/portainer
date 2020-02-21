import _ from 'lodash-es';
import {KubernetesPodViewModel} from '../models/pod';
import {KubernetesCommonParams} from 'Kubernetes/models/common/params';
import PortainerError from 'Portainer/error';

angular.module('portainer.kubernetes')
  .factory('KubernetesPodService', ['$async', 'KubernetesPods',
    function KubernetesPodServiceFactory($async, KubernetesPods) {
      'use strict';
      var factory = {
        pods: pods,
        logs: logs
      };

      /**
       * Pods
       *
       * @param {string} namespace
       */
      async function podsAsync(namespace) {
        try {
          const data = await KubernetesPods(namespace).get().$promise;
          return _.map(data.items, (item) => new KubernetesPodViewModel(item));
        } catch (err) {
          throw new PortainerError('Unable to retrieve pods', err);
        }
      }

      function pods(namespace) {
        return $async(podsAsync, namespace);
      }

      /**
       * Logs
       *
       * @param {string} namespace
       * @param {string} podName
       */
      async function logsAsync(namespace, podName) {
        const params = new KubernetesCommonParams();
        params.id = podName;
        try {
          const data = await KubernetesPods(namespace).logs(params).$promise;
          return data.logs.length === 0 ? [] : data.logs.split("\n");
        } catch (err) {
          throw new PortainerError('Unable to retrieve pod logs', err);
        }
      }

      function logs(namespace, podName) {
        return $async(logsAsync, namespace, podName);
      }

      return factory;
    }]);