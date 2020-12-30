import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import { KubernetesIngressConverter } from './converter';

/* @ngInject */
export function KubernetesIngressService($async, KubernetesIngresses) {
  return {
    get,
    create,
    patch,
    delete: _delete,
  };

  async function getOne(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([KubernetesIngresses(namespace).get(params).$promise, KubernetesIngresses(namespace).getYaml(params).$promise]);
      const res = {
        Raw: KubernetesIngressConverter.apiToModel(raw),
        Yaml: yaml.data,
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingress', err);
    }
  }

  async function getAll(namespace) {
    try {
      const data = await KubernetesIngresses(namespace).get().$promise;
      const res = _.reduce(data.items, (arr, item) => _.concat(arr, KubernetesIngressConverter.apiToModel(item)), []);
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingresses', err);
    }
  }

  function get(namespace, name) {
    if (name) {
      return $async(getOne, namespace, name);
    }
    return $async(getAll, namespace);
  }

  function create(ingress) {
    return $async(async () => {
      try {
        const params = {};
        const payload = KubernetesIngressConverter.createPayload(ingress);
        const namespace = payload.metadata.namespace;
        const data = await KubernetesIngresses(namespace).create(params, payload).$promise;
        return data;
      } catch (err) {
        throw new PortainerError('Unable to create ingress', err);
      }
    });
  }

  function patch(oldIngress, newIngress) {
    return $async(async () => {
      try {
        const params = new KubernetesCommonParams();
        params.id = newIngress.Name;
        const namespace = newIngress.Namespace;
        const payload = KubernetesIngressConverter.patchPayload(oldIngress, newIngress);
        if (!payload.length) {
          return;
        }
        const data = await KubernetesIngresses(namespace).patch(params, payload).$promise;
        return data;
      } catch (err) {
        throw new PortainerError('Unable to patch ingress', err);
      }
    });
  }

  function _delete(ingress) {
    return $async(async () => {
      try {
        const params = new KubernetesCommonParams();
        params.id = ingress.Name;
        const namespace = ingress.Namespace;
        await this.KubernetesIngresses(namespace).delete(params).$promise;
      } catch (err) {
        throw new PortainerError('Unable to delete ingress', err);
      }
    });
  }
}

angular.module('portainer.kubernetes').service('KubernetesIngressService', KubernetesIngressService);
