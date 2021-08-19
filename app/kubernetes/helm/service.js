import angular from 'angular';
import PortainerError from 'Portainer/error';

angular.module('portainer.kubernetes').factory('HelmService', HelmService);

/* @ngInject */
export function HelmService(HelmFactory, EndpointProvider) {
  return {
    search,
    values,
    install,
  };

  /**
   * @description: Searches for all helm charts in a helm repo
   * @returns {Promise} - Resolves with `index.yaml` of helm charts for a repo
   * @throws {PortainerError} - Rejects with error if searching for the `index.yaml` fails
   */
  async function search() {
    try {
      return await HelmFactory.templates().$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve helm charts', err);
    }
  }

  /**
   * @description: Show values helm of a helm chart, this basically runs `helm show values`
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function values(chart) {
    try {
      return await HelmFactory.show({ chart, type: 'values' }).$promise;
    } catch (err) {
      throw new PortainerError('Unable to retrieve values from chart', err);
    }
  }

  /**
   * @description: Installs a helm chart, this basically runs `helm install`
   * @returns {Promise} - Resolves with `values.yaml` of helm chart values for a repo
   * @throws {PortainerError} - Rejects with error if helm show fails
   */
  async function install(appname, namespace, chart, values) {
    const endpointId = EndpointProvider.currentEndpoint().Id;
    const payload = {
      Name: appname,
      Namespace: namespace,
      Chart: chart,
      Values: values,
    };
    return await HelmFactory.install({ endpointId }, payload).$promise;
  }
}
