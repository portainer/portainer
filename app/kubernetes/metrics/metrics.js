import angular from 'angular';
import PortainerError from 'Portainer/error';
import { KubernetesCommonParams } from 'Kubernetes/models/common/params';

class KubernetesMetricsService {
  /* @ngInject */
  constructor($async, KubernetesMetrics) {
    this.$async = $async;
    this.KubernetesMetrics = KubernetesMetrics;

    this.capabilitiesAsync = this.capabilitiesAsync.bind(this);
    this.getPodAsync = this.getPodAsync.bind(this);
  }

  /**
   * GET
   */
  async capabilitiesAsync(endpointID) {
    try {
      await this.KubernetesMetrics().capabilities({ endpointId: endpointID }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve metrics', err);
    }
  }

  capabilities(endpointID) {
    return this.$async(this.capabilitiesAsync, endpointID);
  }

  /**
   * Stats
   *
   * @param {string} namespace
   * @param {string} podName
   */
  async getPodAsync(namespace, podName) {
    try {
      const params = new KubernetesCommonParams();
      params.id = podName;
      const data = await this.KubernetesMetrics(namespace).getPod(params).$promise;
      return data;
    } catch (err) {
      throw new PortainerError('Unable to retrieve pod stats', err);
    }
  }

  getPod(namespace, podName) {
    return this.$async(this.getPodAsync, namespace, podName);
  }
}

export default KubernetesMetricsService;
angular.module('portainer.kubernetes').service('KubernetesMetricsService', KubernetesMetricsService);
