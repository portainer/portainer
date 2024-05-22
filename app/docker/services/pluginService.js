import { isFulfilled } from '@/portainer/helpers/promise-utils';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';
import { aggregateData, getPlugins } from '@/react/docker/proxy/queries/useServicePlugins';

angular.module('portainer.docker').factory('PluginService', PluginServiceFactory);

/* @ngInject */
function PluginServiceFactory(AngularToReact) {
  return {
    volumePlugins: AngularToReact.useAxios(async (environmentId, systemOnly) => {
      const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
      return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Volume');
    }), // volume create
    networkPlugins: AngularToReact.useAxios(async (environmentId, systemOnly) => {
      const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
      return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Network');
    }), // network create
    loggingPlugins: AngularToReact.useAxios(async (environmentId, systemOnly) => {
      const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
      return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Log');
    }), // service create + service edit
  };
}

async function getAllPlugins(environmentId) {
  const [system, plugins] = await Promise.allSettled([getInfo(environmentId), getPlugins(environmentId)]);
  const systemPluginsData = isFulfilled(system) ? system.value.Plugins : undefined;
  const pluginsData = isFulfilled(plugins) ? plugins.value : undefined;

  return { systemPluginsData, pluginsData };
}
