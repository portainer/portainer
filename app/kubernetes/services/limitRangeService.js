import _ from 'lodash-es';
import {KubernetesLimitRangeViewModel} from 'Kubernetes/models/limitRange';

angular.module("portainer.kubernetes").factory("KubernetesLimitRangeService", [
  "$async", "KubernetesLimitRanges",
  function KubernetesLimitRangeServiceFactory($async, KubernetesLimitRanges) {
    "use strict";
    const service = {
      create: create,
      limitRanges: limitRanges,
      remove: remove
    };

    /**
     * LimitRanges
     */
    async function limitRangesAsync(namespace) {
      try {
        const data = await KubernetesLimitRanges.query({namespace: namespace}).$promise;
        return _.map(data.items, (item) => new KubernetesLimitRangeViewModel(item));
      } catch (err) {
        throw { msg: 'Unable to retrieve limit ranges', err: err};
      }
    }

    function limitRanges(namespace) {
      return $async(limitRangesAsync, namespace);
    }

    /**
     * Creation
     */
    async function createAsync(limitRange, cpu, memory) {
      try {
        const payload = {
          metadata: {
            name: limitRange.Name,
            namespace: limitRange.Namespace
          },
          spec: {
            limits: limitRange.Limits
          }
        };
        if (cpu === 0) {
          delete payload.spec.limits[0].default.cpu;
        }
        if (memory === 0) {
          delete payload.spec.limits[0].default.memory;
        }
        const data = await KubernetesLimitRanges.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create limit range', err: err };
      }
    }

    function create(limitRange, cpu, memory) {
      return $async(createAsync, limitRange, cpu, memory);
    }

    /**
     * Delete
     */
    async function removeAsync(limitRange) {
      try {
        const payload = {
          namespace: limitRange.Namespace,
          id: limitRange.Name
        };
        await KubernetesLimitRanges.delete(payload).$promise;
      } catch (err) {
        throw { msg: 'Unable to delete limit range', err: err };
      }
    }

    function remove(limitRange) {
      return $async(removeAsync, limitRange);
    }

    return service;
  }
]);
