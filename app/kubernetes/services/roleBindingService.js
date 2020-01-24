import angular from 'angular';
import PortainerError from 'Portainer/error';

import { KubernetesRoleBinding } from 'Kubernetes/models/role-binding/models';
import KubernetesRoleBindingConvertor from 'Kubernetes/convertors/roleBinding';

class KubernetesRoleBindingService {
  /* @ngInject */
  constructor($async, KubernetesRoleBindings) {
    this.$async = $async;
    this.KubernetesRoleBindings = KubernetesRoleBindings;

    this.getAsync = this.getAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace) {
    try {
      const payload = KubernetesRoleBindingConvertor.getPayload(namespace);
      const data = await this.KubernetesRoleBindings(namespace).get(payload).$promise;
      return KubernetesRoleBindingConvertor.apiToRoleBinding(data);
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
      const payload = KubernetesRoleBindingConvertor.createPayload(namespace);
      const data = await this.KubernetesRoleBindings(namespace).create(payload).$promise;
      return KubernetesRoleBindingConvertor.apiToRoleBinding(data);
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
      // get SA and co
      let rb = await this.get(namespace)
      // if (rb.Id === 0) {
      //   rb = await this.create(namespace)
      // }
      const payload = KubernetesRoleBindingConvertor.updatePayload(rb, newAccesses);
      console.log(payload);
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