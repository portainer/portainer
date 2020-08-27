import angular from 'angular';
import PortainerError from 'Portainer/error';
import _ from 'lodash-es';
import { KubernetesComponentStatusConverter } from './converter';

class KubernetesComponentStatusService {
  /* @ngInject */
  constructor($async, KubernetesComponentStatus) {
    this.$async = $async;
    this.KubernetesComponentStatus = KubernetesComponentStatus;

    this.getAsync = this.getAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync() {
    try {
      const data = await this.KubernetesComponentStatus().get().$promise;
      const res = _.map(data.items, (item) => KubernetesComponentStatusConverter.apiToModel(item));
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve cluster status', err);
    }
  }

  get() {
    return this.$async(this.getAsync);
  }
}

export default KubernetesComponentStatusService;
angular.module('portainer.kubernetes').service('KubernetesComponentStatusService', KubernetesComponentStatusService);
