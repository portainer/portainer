import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesStorageClassConverter from 'Kubernetes/converters/storageClass';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesStorageService {
  /* @ngInject */
  constructor($async, KubernetesStorage) {
    this.$async = $async;
    this.KubernetesStorage = KubernetesStorage;

    this.getAsync = this.getAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(endpointId) {
    try {
      const params = {
        endpointId: endpointId,
      };
      const classes = await this.KubernetesStorage().get(params).$promise;
      const res = _.map(classes.items, (item) => KubernetesStorageClassConverter.apiToStorageClass(item));
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve storage classes', err);
    }
  }

  get(endpointId) {
    return this.$async(this.getAsync, endpointId);
  }

  /**
   * PATCH
   */
  async patchAsync(endpointId, oldStorageClass, newStorageClass) {
    try {
      const params = new KubernetesCommonParams();
      params.id = newStorageClass.Name;
      params.endpointId = endpointId;
      const payload = KubernetesStorageClassConverter.patchPayload(oldStorageClass, newStorageClass);
      await this.KubernetesStorage().patch(params, payload).$promise;
    } catch (err) {
      throw new PortainerError('Unable to patch storage class', err);
    }
  }

  patch(endpointId, oldStorageClass, newStorageClass) {
    return this.$async(this.patchAsync, endpointId, oldStorageClass, newStorageClass);
  }
}

export default KubernetesStorageService;
angular.module('portainer.kubernetes').service('KubernetesStorageService', KubernetesStorageService);
