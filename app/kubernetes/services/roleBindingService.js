import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';

import { KubernetesRoleBinding } from 'Kubernetes/models/role-binding/models';
import KubernetesRoleBindingConverter from 'Kubernetes/converters/roleBinding';
import $allSettled from 'Portainer/services/allSettled';

class KubernetesRoleBindingService {
  /* @ngInject */
  constructor($async, KubernetesServiceAccountService, KubernetesRoleBindings) {
    this.$async = $async;
    this.KubernetesRoleBindings = KubernetesRoleBindings;
    this.KubernetesServiceAccountService = KubernetesServiceAccountService;

    this.getAsync = this.getAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace) {
    try {
      const payload = KubernetesRoleBindingConverter.getPayload(namespace);
      const data = await this.KubernetesRoleBindings(namespace).get(payload).$promise;
      return KubernetesRoleBindingConverter.apiToRoleBinding(data);
    } catch (err) {
      if (err.status === 404) {
        return new KubernetesRoleBinding();
      }
      throw new PortainerError('Unable to retrieve role binding', err);
    }
  }

  get(namespace) {
    return this.$async(this.getAsync, namespace);
  }


  /**
   * CREATE
   */
  async createAsync(namespace) {
    try {
      const payload = KubernetesRoleBindingConverter.createPayload(namespace);
      const data = await this.KubernetesRoleBindings(namespace).create(payload).$promise;
      return KubernetesRoleBindingConverter.apiToRoleBinding(data);
    } catch (err) {
      throw new PortainerError('Unable to create role binding', err);
    }
  }

  create(namespace) {
    return this.$async(this.createAsync, namespace);
  }

  /**
   * UPDATE
   * fetch ServiceAccounts and RoleBinding
   * create the non existing ones
   */
  async updateAsync(namespace, newAccesses) {
    try {
      let rb = await this.get(namespace)
      if (rb.Id === 0) {
        rb = await this.create(namespace)
      }
      const queryServAccounts = await $allSettled(_.map(newAccesses, (item) => this.KubernetesServiceAccountService.getForUser(item)));
      console.log(queryServAccounts);

      // const saToCreate = _.filter(newAccesses, 
      // const createdServiceAccounts = await Promise.all(_.map(serviceAccounts.rejected, (item) => this.KubernetesServiceAccountService.create(item)))
      const payload = KubernetesRoleBindingConverter.updatePayload(rb, newAccesses);
      console.log('payload', payload);
      // const res = await this.KubernetesRoleBindings(namespace).update(payload).$promise;
      // return res;
    } catch (err) {
      console.log(err);
      throw new PortainerError('Unable to update role binding', err);
    }
  }
  update(namespace, newAccesses) {
    return this.$async(this.updateAsync, namespace, newAccesses);
  }
}

export default KubernetesRoleBindingService;
angular.module('portainer.kubernetes').service('KubernetesRoleBindingService', KubernetesRoleBindingService);