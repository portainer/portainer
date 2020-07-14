import * as _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';
import { KubernetesIngressConverter } from './converter';

class KubernetesIngressService {
  /* @ngInject */
  constructor($async, KubernetesIngresses) {
    this.$async = $async;
    this.KubernetesIngresses = KubernetesIngresses;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [raw, yaml] = await Promise.all([this.KubernetesIngresses(namespace).get(params).$promise, this.KubernetesIngresses(namespace).getYaml(params).$promise]);
      const res = {
        Raw: KubernetesIngressConverter.apiToModel(raw),
        Yaml: yaml.data,
      };
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingress', err);
    }
  }

  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesIngresses(namespace).get().$promise;
      const res = _.reduce(data.items, (arr, item) => _.concat(arr, KubernetesIngressConverter.apiToModel(item)), []);
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve Ingresses', err);
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    return this.$async(this.getAllAsync, namespace);
  }
}

export default KubernetesIngressService;
angular.module('portainer.kubernetes').service('KubernetesIngressService', KubernetesIngressService);
