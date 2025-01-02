import { getConfig } from '@/react/docker/configs/queries/useConfig';
import { getConfigs } from '@/react/docker/configs/queries/useConfigs';

import { deleteConfig } from '@/react/docker/configs/queries/useDeleteConfigMutation';
import { createConfig } from '@/react/docker/configs/queries/useCreateConfigMutation';
import { ConfigViewModel } from '../models/config';

angular.module('portainer.docker').factory('ConfigService', ConfigServiceFactory);

/* @ngInspect */
function ConfigServiceFactory(AngularToReact) {
  const { useAxios } = AngularToReact;

  return {
    configs: useAxios(listConfigsAngularJS), // config list + service create + service edit
    config: useAxios(getConfigAngularJS), // config create + config edit
    remove: useAxios(deleteConfig), // config list + config edit
    create: useAxios(createConfig), // config create
  };

  /**
   * @param {EnvironmentId} environmentId
   */
  async function listConfigsAngularJS(environmentId) {
    const data = await getConfigs(environmentId);
    return data.map((c) => new ConfigViewModel(c));
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {ConfigId} configId
   */
  async function getConfigAngularJS(environmentId, configId) {
    const data = await getConfig(environmentId, configId);
    return new ConfigViewModel(data);
  }
}
