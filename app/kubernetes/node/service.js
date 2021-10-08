import angular from 'angular';
import _ from 'lodash-es';

import PortainerError from 'Portainer/error';
import KubernetesNodeConverter from 'Kubernetes/node/converter';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesNodeService {
  /* @ngInject */
  constructor($async, KubernetesNodes) {
    this.$async = $async;
    this.KubernetesNodes = KubernetesNodes;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(name) {
    try {
      const params = new KubernetesCommonParams();
      params.id = name;
      const [details, yaml] = await Promise.all([this.KubernetesNodes().get(params).$promise, this.KubernetesNodes().getYaml(params).$promise]);
      return KubernetesNodeConverter.apiToNodeDetails(details, yaml);
    } catch (err) {
      // changing the structure of error message to fix [object, Object] issue
      const errData = err.data;
      throw new PortainerError('Unable to retrieve node details', errData);
    }
  }

  async getAllAsync() {
    try {
      const data = await this.KubernetesNodes().get().$promise;
      return _.map(data.items, (item) => KubernetesNodeConverter.apiToNode(item));
    } catch (err) {
      throw { msg: 'Unable to retrieve nodes', err: err };
    }
  }

  get(name) {
    if (name) {
      return this.$async(this.getAsync, name);
    }
    return this.$async(this.getAllAsync);
  }

  /**
   * PATCH
   */

  async patchAsync(node, nodeFormValues) {
    try {
      const params = new KubernetesCommonParams();
      params.id = node.Name;
      const newNode = KubernetesNodeConverter.formValuesToNode(node, nodeFormValues);
      const payload = KubernetesNodeConverter.patchPayload(node, newNode);
      const data = await this.KubernetesNodes().patch(params, payload).$promise;
      const patchedNode = KubernetesNodeConverter.apiToNodeDetails(data);
      return patchedNode;
    } catch (err) {
      throw { msg: 'Unable to patch node', err: err };
    }
  }

  patch(node, nodeFormValues) {
    return this.$async(this.patchAsync, node, nodeFormValues);
  }
}

export default KubernetesNodeService;
angular.module('portainer.kubernetes').service('KubernetesNodeService', KubernetesNodeService);
