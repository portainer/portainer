import _ from 'lodash-es';

import angular from 'angular';
import KubernetesResourcePoolConverter from 'Kubernetes/converters/resourcePool';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';

/* @ngInject */
export function KubernetesResourcePoolService(
  $async,
  EndpointService,
  KubernetesNamespaceService,
  KubernetesResourceQuotaService,
  KubernetesIngressService,
  KubernetesPortainerNamespaces
) {
  return {
    get,
    create,
    patch,
    delete: _delete,
    toggleSystem,
  };

  // getting quota isn't a costly operation for one namespace, so we can get it by default
  async function getOne(name, { getQuota = true }) {
    const namespace = await KubernetesNamespaceService.get(name);
    const pool = KubernetesResourcePoolConverter.apiToResourcePool(namespace);
    if (getQuota) {
      const [quotaAttempt] = await Promise.allSettled([KubernetesResourceQuotaService.get(name, KubernetesResourceQuotaHelper.generateResourceQuotaName(name))]);
      if (quotaAttempt.status === 'fulfilled') {
        pool.Quota = quotaAttempt.value;
        pool.Yaml += '---\n' + quotaAttempt.value.Yaml;
      }
    }
    return pool;
  }

  // getting the quota for all namespaces is costly by default, so disable getting it by default
  async function getAll({ getQuota = false }) {
    const namespaces = await KubernetesNamespaceService.get();
    const pools = await Promise.all(
      _.map(namespaces, async (namespace) => {
        const name = namespace.Name;
        const pool = KubernetesResourcePoolConverter.apiToResourcePool(namespace);
        if (getQuota) {
          const [quotaAttempt] = await Promise.allSettled([KubernetesResourceQuotaService.get(name, KubernetesResourceQuotaHelper.generateResourceQuotaName(name))]);
          if (quotaAttempt.status === 'fulfilled') {
            pool.Quota = quotaAttempt.value;
            pool.Yaml += '---\n' + quotaAttempt.value.Yaml;
          }
        }
        return pool;
      })
    );
    return pools;
  }

  function get(name, options = {}) {
    if (name) {
      return $async(getOne, name, options);
    }
    return $async(getAll, options);
  }

  function create(formValues) {
    return $async(async () => {
      const [namespace, quota, ingresses, registries] = KubernetesResourcePoolConverter.formValuesToResourcePool(formValues);
      await KubernetesNamespaceService.create(namespace);

      if (quota) {
        await KubernetesResourceQuotaService.create(quota);
      }
      const ingressPromises = _.map(ingresses, (i) => KubernetesIngressService.create(i));
      await Promise.all(ingressPromises);

      const endpointId = formValues.EndpointId;
      const registriesPromises = _.map(registries, (r) => EndpointService.updateRegistryAccess(endpointId, r.Id, r.RegistryAccesses[endpointId]));
      await Promise.all(registriesPromises);
    });
  }

  function patch(oldFormValues, newFormValues) {
    return $async(async () => {
      const [, oldQuota, oldIngresses, oldRegistries] = KubernetesResourcePoolConverter.formValuesToResourcePool(oldFormValues);
      const [, newQuota, newIngresses, newRegistries] = KubernetesResourcePoolConverter.formValuesToResourcePool(newFormValues);

      if (oldQuota && newQuota) {
        await KubernetesResourceQuotaService.patch(oldQuota, newQuota);
      } else if (!oldQuota && newQuota) {
        await KubernetesResourceQuotaService.create(newQuota);
      } else if (oldQuota && !newQuota) {
        await KubernetesResourceQuotaService.delete(oldQuota);
      }

      const create = _.filter(newIngresses, (ing) => !_.find(oldIngresses, { Name: ing.Name }));
      const del = _.filter(oldIngresses, (ing) => !_.find(newIngresses, { Name: ing.Name }));
      const patch = _.without(newIngresses, ...create);

      const createPromises = _.map(create, (i) => KubernetesIngressService.create(i));
      const delPromises = _.map(del, (i) => KubernetesIngressService.delete(i.Namespace, i.Name));
      const patchPromises = _.map(patch, (ing) => {
        const old = _.find(oldIngresses, { Name: ing.Name });
        ing.Paths = angular.copy(old.Paths);
        ing.PreviousHost = old.Host;
        return KubernetesIngressService.patch(old, ing);
      });

      const promises = _.flatten([createPromises, delPromises, patchPromises]);
      await Promise.all(promises);

      const endpointId = newFormValues.EndpointId;
      const keptRegistries = _.intersectionBy(oldRegistries, newRegistries, 'Id');
      const removedRegistries = _.without(oldRegistries, ...keptRegistries);

      const newRegistriesPromises = _.map(newRegistries, (r) => EndpointService.updateRegistryAccess(endpointId, r.Id, r.RegistryAccesses[endpointId]));
      const removedRegistriesPromises = _.map(removedRegistries, (r) => {
        _.pull(r.RegistryAccesses[endpointId].Namespaces, newFormValues.Name);
        return EndpointService.updateRegistryAccess(endpointId, r.Id, r.RegistryAccesses[endpointId]);
      });

      await Promise.all(_.concat(newRegistriesPromises, removedRegistriesPromises));
    });
  }

  function _delete(pool) {
    return $async(async () => {
      await KubernetesNamespaceService.delete(pool.Namespace);
    });
  }

  function toggleSystem(endpointId, namespaceName, system) {
    return KubernetesPortainerNamespaces.toggleSystem({ namespaceName, endpointId }, { system }).$promise;
  }
}

angular.module('portainer.kubernetes').service('KubernetesResourcePoolService', KubernetesResourcePoolService);
