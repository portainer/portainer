import angular from 'angular';
import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import KubernetesConfigurationConverter from 'Kubernetes/converters/configuration';
import KubernetesConfigMapConverter from 'Kubernetes/converters/configMap';
import KubernetesSecretConverter from 'Kubernetes/converters/secret';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

class KubernetesConfigurationService {
  /* @ngInject */
  constructor($async, Authentication, KubernetesNamespaceService, KubernetesConfigMapService, KubernetesSecretService) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesConfigMapService = KubernetesConfigMapService;
    this.KubernetesSecretService = KubernetesSecretService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.getAllFilteredAsync = this.getAllFilteredAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const [configMap, secret] = await Promise.allSettled([
        this.KubernetesConfigMapService.get(namespace, name),
        this.KubernetesSecretService.get(namespace, name)
      ]);
      if (configMap.status === 'fulfilled') {
        return KubernetesConfigurationConverter.configMapToConfiguration(configMap.value);
      }
      return KubernetesConfigurationConverter.secretToConfiguration(secret.value);
    } catch (err) {
      throw new PortainerError('Unable to retrieve configuration', err);
    }
  }

  async getAllFilteredAsync(namespace) {
    try {
      let namespaces;
      if (namespace) {
        const ns = await this.KubernetesNamespaceService.get(namespace);
        namespaces = [ns];
      } else {
        namespaces = await this.KubernetesNamespaceService.get();
      }
      const promises = _.map(namespaces, (item) => this.getAllAsync(item.Name));
      const res = await Promise.all(promises);
      return _.flatten(res);
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync(namespace) {
    try {
      const [configMaps, secrets] = await Promise.all([
        this.KubernetesConfigMapService.get(namespace),
        this.KubernetesSecretService.get(namespace)
      ]);
      const secretsConfigurations = _.map(secrets, secret => KubernetesConfigurationConverter.secretToConfiguration(secret));
      const configMapsConfigurations = _.map(configMaps, configMap => KubernetesConfigurationConverter.configMapToConfiguration(configMap));
      return _.concat(configMapsConfigurations, secretsConfigurations);
    } catch (err) {
      throw new PortainerError('Unable to retrieve configurations', err);
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    const isAdmin = this.Authentication.isAdmin();
    if (!isAdmin) {
      return this.$async(this.getAllFilteredAsync, namespace);
    }
    return this.$async(this.getAllAsync, namespace);
  }

  /**
   * CREATE
   */
  async createAsync(config) {
    try {
      if (config.Type === KubernetesConfigurationTypes.BASIC) {
        const configMap = KubernetesConfigMapConverter.configurationToConfigMap(config);
        await this.KubernetesConfigMapService.create(configMap);
      } else {
        const secret = KubernetesSecretConverter.configurationToSecret(config);
        await this.KubernetesSecretService.create(secret);
      }
    } catch (err) {
      throw new PortainerError('Unable to create config map', err);
    }
  }

  create(config) {
    return this.$async(this.createAsync, config);
  }

  /**
   * UPDATE
   */
  async updateAsync(config) {
    try {
      if (config.Type === KubernetesConfigurationTypes.BASIC) {
        const configMap = KubernetesConfigMapConverter.configurationToConfigMap(config);
        await this.KubernetesConfigMapService.update(configMap);
      } else {
        const secret = KubernetesSecretConverter.configurationToSecret(config);
        await this.KubernetesSecretService.update(secret);
      }
    } catch (err) {
      throw new PortainerError('Unable to update configuration', err);
    }
  }
  update(config) {
    return this.$async(this.updateAsync, config);
  }

  /**
   * DELETE
   */
  async deleteAsync(config) {
    try {
      if (config.Type === KubernetesConfigurationTypes.BASIC) {
        const configMap = KubernetesConfigMapConverter.configurationToConfigMap(config);
        await this.KubernetesConfigMapService.delete(configMap);
      } else {
        const secret = KubernetesSecretConverter.configurationToSecret(config);
        await this.KubernetesSecretService.delete(secret);
      }
    } catch(err) {
      throw new PortainerError('Unable to delete configuration', err)
    }
  }

  delete(config) {
    return this.$async(this.deleteAsync, config);
  }
}

export default KubernetesConfigurationService;
angular.module('portainer.kubernetes').service('KubernetesConfigurationService', KubernetesConfigurationService);