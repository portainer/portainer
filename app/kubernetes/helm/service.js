import angular from 'angular';
import PortainerError from 'Portainer/error';

angular.module('portainer.kubernetes').factory('HelmService', HelmService);

/* @ngInject */
export function HelmService(HelmFactory) {
  return {
    search,
    values,
    getHelmRepositories,
    addHelmRepository,
    install,
    uninstall,
    listReleases,
  };

  /**
   * @description: Searches for all helm charts in a helm repo
   * @param {string} repo - repo url to search charts for
   * @returns {Promise} - Resolves with `index.yaml` of helm charts for a repo
   * @throws {PortainerError} - Rejects with error if searching for the `index.yaml` fails
   */
  async function search(repo) {
    try {
      return await HelmFactory.templates({ repo }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve helm charts', err);
    }
  }

  /**
   * @description: Show values helm of a helm chart, this basically runs `helm show values`
   * @param {string} repo - repo url to search charts values for
   * @param {string} chart - chart within the repo to retrieve default values
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function values(repo, chart) {
    try {
      return await HelmFactory.show({ repo, chart, type: 'values' }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve values from chart', err);
    }
  }

  /**
   * @description: Get a list of all the helm repositories available for the current user
   * @returns {Promise} - Resolves with an object containing list of user helm repos and default/global settings helm repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function getHelmRepositories(endpointId) {
    return await HelmFactory.getHelmRepositories({ endpointId }).$promise;
  }

  /**
   * @description: Adds a helm repo for the calling user
   * @param {Object} payload - helm repo url to add for the user
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function addHelmRepository(endpointId, payload) {
    return await HelmFactory.addHelmRepository({ endpointId }, payload).$promise;
  }

  /**
   * @description: Installs a helm chart, this basically runs `helm install`
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function install(endpointId, payload) {
    return await HelmFactory.install({ endpointId }, payload).$promise;
  }

  /**
   * @description: Uninstall a helm chart, this basically runs `helm uninstall`
   * @param {Object} options - Options object, release `Name` is the only required option
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function uninstall(endpointId, { Name, ResourcePool }) {
    try {
      await HelmFactory.uninstall({ endpointId, release: Name, namespace: ResourcePool }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete release', err);
    }
  }

  /**
   * @description: List all helm releases based on passed in options, this basically runs `helm list`
   * @param {Object} options - Supported CLI flags to pass to Helm (binary) - flags to `helm list`
   * @returns {Promise} - Resolves with list of helm releases
   * @throws {PortainerError} - Rejects with error if helm list fails
   */
  async function listReleases(endpointId, { namespace, selector, filter, output }) {
    try {
      const releases = await HelmFactory.list({ endpointId, selector, namespace, filter, output }).$promise;
      return releases;
    } catch (err) {
      throw new PortainerError('Unable to retrieve release list', err);
    }
  }
}
