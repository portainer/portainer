import { getConfig } from '@/react/docker/configs/queries/useConfig';
import { getConfigs } from '@/react/docker/configs/queries/useConfigs';

import { deleteConfig } from '@/react/docker/configs/queries/useDeleteConfigMutation';
import { createConfig } from '@/react/docker/configs/queries/useCreateConfigMutation';
import { ConfigViewModel } from '../models/config';

angular.module('portainer.docker').factory('ConfigService', ConfigServiceFactory);

/* @ngInspect */
function ConfigServiceFactory() {
  return {
    configs: async (environmentId) => {
      const data = await getConfigs(environmentId);
      return data.map((c) => new ConfigViewModel(c));
    }, // config list + service create + service edit
    config: async (environmentId, configId) => {
      const data = await getConfig(environmentId, configId);
      return new ConfigViewModel(data);
    }, // config create + config edit
    remove: deleteConfig, // config list + config edit
    create: createConfig, // config create
  };
}
