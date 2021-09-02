import angular from 'angular';
import PortainerError from 'Portainer/error';

angular.module('portainer.kubernetes').factory('HelmService', HelmService);

/* @ngInject */
export function HelmService(HelmFactory, EndpointProvider) {
  return {
    search,
    values,
    install,
    uninstall,
    listReleases,
  };

  /**
   * @description: Searches for all helm charts in a helm repo
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
   * @description: Installs a helm chart, this basically runs `helm install`
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function install(appname, repo, chart, values, namespace) {
    const endpointId = EndpointProvider.currentEndpoint().Id;
    const payload = {
      Name: appname,
      Repo: repo,
      Chart: chart,
      Values: values,
      Namespace: namespace,
    };
    return await HelmFactory.install({ endpointId }, payload).$promise;
  }

  /**
   * @description: Uninstall a helm chart, this basically runs `helm uninstall`
   * @param {object} options - Options object, release `Name` is the only required option
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function uninstall({ Name }) {
    try {
      await HelmFactory.uninstall({ release: Name }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to delete release', err);
    }
  }

  /**
   * @description: List all helm releases based on passed in options, this basically runs `helm list`
   * @param {object} options - Supported CLI flags to pass to Helm (binary) - flags to `helm list`
   * @returns {Promise} - Resolves with list of helm releases
   * @throws {PortainerError} - Rejects with error if helm list fails
   */
  async function listReleases({ namespace, selector, filter, output }) {
    try {
      const releases = await HelmFactory.list({ selector, namespace, filter, output }).$promise;
      return releases;
    } catch (err) {
      throw new PortainerError('Unable to retrieve release list', err);
    }
  }
}
