import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from "Portainer/error";

import { KubernetesPortainerServiceAccountNamespace, KubernetesServiceAccount } from "Kubernetes/models/service-account/models";
import KubernetesServiceAccountConvertor from "Kubernetes/convertors/serviceAccount";

class KubernetesServiceAccountService {
  /* @ngInject */
  constructor($async, KubernetesServiceAccounts) {
    this.$async = $async;
    this.KubernetesServiceAccounts = KubernetesServiceAccounts;

    this.listAsync = this.listAsync.bind(this);
    this.getAsync = this.getAsync.bind(this);
  }

  /**
   * LIST
   */
  async listAsync() {
    try {
      const data = await this.KubernetesServiceAccounts(KubernetesPortainerServiceAccountNamespace).get().$promise;
      return _.map(data.items, (item) => KubernetesServiceAccountConvertor.apiToServiceAccount(item));
    } catch (err) {
      throw new PortainerError('Unable to retrieve service accounts', err);
    }
  }

  list() {
    return this.$async(this.listAsync);
  }

  /**
   * GET
   */
  async getAsync(payload) {
    try {
      const data = await this.KubernetesServiceAccounts(KubernetesPortainerServiceAccountNamespace).get(payload).$promise;
      return KubernetesServiceAccountConvertor.apiToServiceAccount(data);
    } catch (err) {
      if (err.status === 404) {
        return new KubernetesServiceAccount();
      }
      throw new PortainerError('Unable to retrieve service account', err);
    }
  }

  get(name) {
    const payload = KubernetesServiceAccountConvertor.getPayload(name);
    return this.$async(this.getAsync, payload);
  }

  getFromUser(user) {
    const payload = KubernetesServiceAccountConvertor.getPayloadFromUser(user);
    return this.$async(this.getAsync, payload);
  }
}

export default KubernetesServiceAccountService;
angular.module('portainer.kubernetes').service('KubernetesServiceAccountService', KubernetesServiceAccountService);