import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import KubernetesStatefulSetConverter from 'Kubernetes/converters/statefulSet';

class KubernetesStatefulSetService {
  /* @ngInject */
  constructor($async, KubernetesStatefulSets, KubernetesServiceService) {
    this.$async = $async;
    this.KubernetesStatefulSets = KubernetesStatefulSets;
    this.KubernetesServiceService = KubernetesServiceService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.rollbackAsync = this.rollbackAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesStatefulSets(namespace).get(params).$promise, this.KubernetesStatefulSets(namespace).getYaml(params).$promise]);
      const res = {
        Raw: raw,
        Yaml: yaml.data,
      };
      const headlessServiceName = raw.spec.serviceName;
      if (headlessServiceName) {
        try {
          const headlessService = await this.KubernetesServiceService.get(namespace, headlessServiceName);
          res.Yaml += '---\n' + headlessService.Yaml;
        } catch (error) {
          // if has error means headless service does not exist
          // skip error as we don't care in this case
        }
      }
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve StatefulSet', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesStatefulSets(namespace).get().$promise;
      return data.items;
    } catch (err) {
      throw new PortainerError('Unable to retrieve StatefulSets', err);
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    return this.$async(this.getAllAsync, namespace);
  }

  /**
   * CREATE
   */
  async createAsync(statefulSet) {
    try {
      const params = {};
      const payload = KubernetesStatefulSetConverter.createPayload(statefulSet);
      const namespace = payload.metadata.namespace;
      const data = await this.KubernetesStatefulSets(namespace).create(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to create statefulSet', err);
    }
  }

  create(statefulSet) {
    return this.$async(this.createAsync, statefulSet);
  }

  /**
   * PATCH
   */
  async patchAsync(oldStatefulSet, newStatefulSet) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newStatefulSet.Name;
      const namespace = newStatefulSet.Namespace;
      const payload = KubernetesStatefulSetConverter.patchPayload(oldStatefulSet, newStatefulSet);
      if (!payload.length) {
        return;
      }

      const data = await this.KubernetesStatefulSets(namespace).patch(params, payload).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to patch statefulSet', err);
    }
  }

  patch(oldStatefulSet, newStatefulSet) {
    return this.$async(this.patchAsync, oldStatefulSet, newStatefulSet);
  }

  /**
   * DELETE
   */
  async deleteAsync(statefulSet) {
    try {
      const params = new KubernetesCommonParams();
      params.id = statefulSet.Name;
      const namespace = statefulSet.Namespace;
      await this.KubernetesStatefulSets(namespace).delete(params).$promise;
    } catch (err) {
      throw new PortainerError('Unable to remove statefulSet', err);
    }
  }

  delete(statefulSet) {
    return this.$async(this.deleteAsync, statefulSet);
  }

  /**
   * ROLLBACK
   */
  async rollbackAsync(namespace, name, payload) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      await this.KubernetesStatefulSets(namespace).rollback(params, payload).$promise;
    } catch (err) {
      throw new PortainerError('Unable to rollback statefulSet', err);
    }
  }

  rollback(namespace, name, payload) {
    return this.$async(this.rollbackAsync, namespace, name, payload);
  }
}

export default KubernetesStatefulSetService;
angular.module('portainer.kubernetes').service('KubernetesStatefulSetService', KubernetesStatefulSetService);
