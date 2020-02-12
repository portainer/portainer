import angular from 'angular';
import _ from 'lodash-es';

import PortainerError from 'Portainer/error';
import KubernetesNodeConverter from 'Kubernetes/converters/node';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesNodeService {
  /* @ngInject */
  constructor($async, KubernetesNodes) {
    this.$async = $async;
    this.KubernetesNodes = KubernetesNodes;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [details, yaml] = await Promise.all([
        this.KubernetesNodes().get(params).$promise,
        this.KubernetesNodes().getYaml(params).$promise
      ]);
      return KubernetesNodeConverter.apiToNodeDetails(details, yaml.data);
    } catch (err) {
      throw new PortainerError('Unable to retrieve node details', err);
    }
  }

  async getAllAsync() {
    try {
      const data = await this.KubernetesNodes().get().$promise;
      return _.map(data.items, (item) => KubernetesNodeConverter.apiToNode(item));
    } catch (err) {
      throw {msg: 'Unable to retrieve nodes', err:err};
    }
  }

  get(name) {
    if (name) {
      return this.$async(this.getAsync, name);
    }
    return this.$async(this.getAllAsync);
  }
}

export default KubernetesNodeService;
angular.module('portainer.kubernetes').service('KubernetesNodeService', KubernetesNodeService);
