import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';
import KubernetesEventConverter from 'Kubernetes/converters/event';

class KubernetesEventService {
  /* @ngInject */
  constructor($async, KubernetesEvents) {
    this.$async = $async;
    this.KubernetesEvents = KubernetesEvents;

    this.getAllAsync = this.getAllAsync.bind(this);
  }

  /**
   * GET
   */
  async getAllAsync(namespace) {
    try {
      const data = await this.KubernetesEvents(namespace).get().$promise;
      const res = _.map(data.items, (item) => KubernetesEventConverter.apiToEvent(item));
      return res;
    } catch (err) {
      throw new PortainerError('Unable to retrieve events', err);
    }
  }

  get(namespace) {
    return this.$async(this.getAllAsync, namespace);
  }
}

export default KubernetesEventService;
angular.module('portainer.kubernetes').service('KubernetesEventService', KubernetesEventService);
